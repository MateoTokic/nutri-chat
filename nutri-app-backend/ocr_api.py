from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import shutil 
import json
import re
import openai
from doctr.io import DocumentFile
from doctr.models import ocr_predictor

load_dotenv("openai_api_key.env")
openai_api_key = os.getenv('OPENAI_API_KEY')
openai.api_key = openai_api_key
ocr_model = ocr_predictor(pretrained=True)

app = Flask(__name__)
CORS(app)  
load_dotenv("flask_key.env")
app.secret_key = os.getenv('FLASK_SECRET_KEY')

UPLOAD_FOLDER = './uploads'
MEAL_FOLDER = os.path.join(UPLOAD_FOLDER, 'meal')
PRODUCT_FOLDER = os.path.join(UPLOAD_FOLDER, 'product')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

for folder in [UPLOAD_FOLDER, MEAL_FOLDER, PRODUCT_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)


def clear_directory(directory):
    if os.path.exists(directory):
        shutil.rmtree(directory)
    os.makedirs(directory)

def save_json(data, path):
    with open(path, 'w') as json_file:
        json.dump(data, json_file, indent=4)

def extract_ingredients(page_dict):
    found_sastoj = False
    extracted_ingredients = []
    current_ingredient = ""

    for block in page_dict['blocks']:
        for line in block['lines']:
            for word in line['words']:
                word_value = word['value']
                if re.search(r'[Ss]astoj', word_value):
                    found_sastoj = True
                    continue
                if found_sastoj:
                    if '.' in word_value:
                        if current_ingredient:
                            extracted_ingredients.append(current_ingredient.strip())
                        found_sastoj = False
                        break
                    if ',' in word_value:
                        current_ingredient += f" {word_value}"
                    else:
                        current_ingredient += f" {word_value}"
                    if word_value.endswith(','):
                        extracted_ingredients.append(current_ingredient.strip())
                        current_ingredient = ""
    return extracted_ingredients

def extract_nutrition_values(page_dict):
    nutrition_data = {}
    current_label = None

    nutrition_labels_mapping = {
        'Energy': [r'Energ'],
        'Fats': [r'Mas', r'Fa'],
        'Carbs': [r'Ugl', r'Carboh'],
        'Protein': [r'Bjel', r'Prot'],
        'Fiber': [r'Vla', r'Fib'],
        'Sodium': [r'So'],
        'Sugar': [r'Se', r'Su'],
        'Saturated': [r'zasic', r'satur'],
        'Unsaturated': [r'nezas', r'unsat'],
    }

    for block in page_dict['blocks']:
        for line in block['lines']:
            for word in line['words']:
                word_value = word['value'].strip().replace(',', '.')

                for label, patterns in nutrition_labels_mapping.items():
                    if any(re.search(pattern, word_value, re.IGNORECASE) for pattern in patterns):
                        current_label = label
                        break
                if current_label and re.search(r'\d+[.,]?\d*\s*[g|mg|kcal|kJ]', word_value):
                    nutrition_data[current_label] = word_value
                    current_label = None
    return nutrition_data

def create_product_advice_prompt(personal_data, nutritional_values, ingredients):
    prompt = f"""
    The user has uploaded the nutritional information and ingredients list of 
    a single product they wish to include in a meal. 

    **User Profile:**
    - Age: {personal_data.get('age', 'N/A')} years old
    - Gender: {personal_data.get('gender', 'N/A')}
    - Activity level: {personal_data.get('activity_level', 'N/A')}/5
    - Height: {personal_data.get('height', 'N/A')} cm tall
    - Wight: {personal_data.get('weight', 'N/A')} kg
    - Target Weight: {personal_data.get('target_weight', 'N/A')} kg.

    Here are the nutritional values for product:
    {', '.join(f"{key}: {value}" for key, value in nutritional_values.items())}

    Ingredients of this product written in Croatian language:
    {', '.join(ingredients)}

    Provide a short, personalized dietary recommendation (no more than 5 sentences) 
    based on the product's nutritional content and the user's dietary goals. 
    Include a suggestion for the amount of this product to consume in a single meal and 
    recommend any complementary ingredients that would create a balanced meal with this product.
    """
    return prompt


def create_meal_advice_prompt(personal_data, total_nutritional_values, all_ingredients):
    prompt = f"""
    The user has provided their profile and a list of products they plan to consume in a meal. 
    Assess if these products, as a combined meal, satisfy the user's dietary goals and needs. 
    
    **User Profile:**
    - Age: {personal_data.get('age', 'N/A')} years old
    - Gender: {personal_data.get('gender', 'N/A')}
    - Activity level: {personal_data.get('activity_level', 'N/A')}/5
    - Height: {personal_data.get('height', 'N/A')} cm tall
    - Wight: {personal_data.get('weight', 'N/A')} kg
    - Target Weight: {personal_data.get('target_weight', 'N/A')} kg.

    **Meal Nutritional Summary:**
    {"; ".join([f"Product {i + 1}: " + ', '.join(f"{key}: {value}" for key, value in values.items()) 
                for i, values in enumerate(total_nutritional_values)])}

    **Ingredients in the Meal**:
    {', '.join(all_ingredients)}

    Provide a short, personalized dietary recommendation (no more than 5 sentences) that highlights 
    any key benefits or concerns, and suggests any minor adjustments if needed to better align with the user's goals.
    """
    return prompt

def generate_advice(prompt):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a nutrition expert."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=250,
        temperature=0.4
    )
    return response.choices[0].message['content']



@app.route('/product-advice/', methods=['POST'])
def process_images():
    clear_directory(PRODUCT_FOLDER)
    
    files = request.files
    if len(files) != 2:
        return jsonify({"error": "Please upload exactly two images"}), 400
    
    personal_data_json = request.form.get('personal_data')
    if personal_data_json:
        personal_data = json.loads(personal_data_json)
    else:
        return jsonify({"error": "No personal data received"}), 400
    
    ingredients_img_path = os.path.join(PRODUCT_FOLDER, files['file1'].filename)
    nutrition_img_path = os.path.join(PRODUCT_FOLDER, files['file2'].filename)

    files['file1'].save(ingredients_img_path)
    files['file2'].save(nutrition_img_path)

    ingredients_doc = DocumentFile.from_images(ingredients_img_path)
    nutrition_doc = DocumentFile.from_images(nutrition_img_path)

    ingredients_page = ocr_model(ingredients_doc)
    nutrition_page = ocr_model(nutrition_doc)

    extracted_ingredients = extract_ingredients(ingredients_page.pages[0].export())
    extracted_nutrition = extract_nutrition_values(nutrition_page.pages[0].export())

    save_json({"ingredients": extracted_ingredients}, os.path.join(PRODUCT_FOLDER, "ingredients.json"))
    save_json({"nutrition_values": extracted_nutrition}, os.path.join(PRODUCT_FOLDER, "nutrition_values.json"))

    prompt = create_product_advice_prompt(personal_data, extracted_nutrition, extracted_ingredients)
    advice = generate_advice(prompt)

    return jsonify({"advice": advice}), 200

@app.route('/meal-advice', methods=['POST'])
def meal_advice():
    try:
        clear_directory(MEAL_FOLDER)

        personal_data_json = request.form.get('personal_data')
        if personal_data_json:
            personal_data = json.loads(personal_data_json)
        else:
            return jsonify({"error": "No personal data received"}), 400
        
        all_ingredients = []
        total_nutritional_values = []

        product_count = len([key for key in request.files.keys() if 'ingredients_image_' in key])
        for index in range(product_count):
            ingredients_image = request.files.get(f'ingredients_image_{index}')
            nutrition_image = request.files.get(f'nutrition_image_{index}')

            if not ingredients_image or not nutrition_image:
                return jsonify({"error": f"Images for product {index + 1} are missing."}), 400

            ingredients_img_path = os.path.join(MEAL_FOLDER, f'ingredients_{index}.jpg')
            nutrition_img_path = os.path.join(MEAL_FOLDER, f'nutrition_{index}.jpg')
            ingredients_image.save(ingredients_img_path)
            nutrition_image.save(nutrition_img_path)
   
            ingredients_doc = DocumentFile.from_images(ingredients_img_path)
            nutrition_doc = DocumentFile.from_images(nutrition_img_path)

            ingredients_page = ocr_model(ingredients_doc)
            nutrition_page = ocr_model(nutrition_doc)

            extracted_ingredients = extract_ingredients(ingredients_page.pages[0].export())
            nutritional_values = extract_nutrition_values(nutrition_page.pages[0].export())

            all_ingredients.extend(extracted_ingredients)
            total_nutritional_values.append(nutritional_values)

        save_json({"ingredients": all_ingredients}, os.path.join(MEAL_FOLDER, "ingredients.json"))
        save_json({"nutrition_values": total_nutritional_values}, os.path.join(MEAL_FOLDER, "nutrition_values.json"))
      
        prompt = create_meal_advice_prompt(personal_data, total_nutritional_values, all_ingredients)
        advice = generate_advice(prompt)

        return jsonify({"advice": advice})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred while processing the meal advice.", "details": str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)