# Nutri-Chat
Nutri-Chat is a mobile application that I developed for the needs of my Master's degree thesis. The thesis deals with the application of large language models (LLM) for understanding and generating dietary advice. The main problem involves identifying ingredients and nutritional values from food products and integrating this data into a system for providing useful recommendations. The problem was solved by developing a mobile application using React Native and Python Flask technologies. By implementing the docTR model for optical character recognition, it is possible to read the nutritional values and ingredients from the product image. Based on recognized ingredients and nutritional values and user data from the Firestore database, the system generates advice using OpenAI's GPT-3.5-turbo model. 



## 🚀 Features
- Interactive UI: User-friendly interface for a smooth experience.
- Product Advice: Dietary advice based on user personal data and photos of ingredients and nutritional values table of food product.
- Meal Advice: Tailored dietary recommendation for meal based on user personal data and photos of ingredients and nutritional values tables of all products included in a meal.

## 🛠️ Technologies Used

### Frontend
- **React Native**: The frontend of the application is built using **React Native**, a popular JavaScript framework for building cross-platform mobile applications. React Native allows for the creation of native apps for iOS and Android using a single codebase, ensuring efficient development and consistent performance.

### Backend
- **Python Flask**: The backend is powered by **Flask**, a lightweight and flexible Python web framework. Flask handles the API requests, user authentication, and interaction with the database, serving as the interface between the frontend and the backend services.
  
### User Authentication
- **Firebase Authentication**: The application uses **Firebase Authentication** to manage user identity and access control.

### Database
- **Firestore Database**: **Firestore**, a cloud-hosted NoSQL database by Firebase, powers the application's real-time data storage and synchronization.

### OCR
- **docTR**: The application utilizes **docTR**, a powerful deep learning library for document text recognition. 

### LLM
- **GPT-3.5-turbo**: The application leverages the **GPT-3.5-turbo** model by OpenAI to deliver advanced natural language understanding and generation capabilities.


| Feature                          | Screenshot                                                                                                           | Feature                          | Screenshot                                                                     |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Authentication Screen            | <img src="https://github.com/user-attachments/assets/49335bf2-1b72-4707-9445-80162a13b2eb" alt="Auth Screen" width="240" height="500"/>              |  Update Personal Data Screen      | <img src="https://github.com/user-attachments/assets/d0402ce8-ebe4-473c-a038-bc8b3af5e359" alt="Update Data Screen" width="240" height="500"/>       |
| Home Screen                      | <img src="https://github.com/user-attachments/assets/80ac2f54-20ff-400f-952f-5047fe31e257" alt="Home Screen" width="240" height="500"/>              |  Product Advice Screen            | <img src="https://github.com/user-attachments/assets/ce40e184-21b4-4ad5-8d14-c0eb9773f82e" alt="Product Advice Screen" width="240" height="500"/>    |
| Product Advice Generated         | <img src="https://github.com/user-attachments/assets/9f6971fc-f1b5-49be-8bbb-5c8ebd086fd9" alt="Product Advice Generated" width="240" height="500"/> | Meal Advice Screen               | <img src="https://github.com/user-attachments/assets/b552b47f-029c-4eab-af1f-dd94dd6e11c2" alt="Meal Advice Screen" width="240" height="500"/>       |
| Meal Advice Generated            | <img src="https://github.com/user-attachments/assets/2ffeeee0-72b8-4f67-84a3-abbb22dae4d0" alt="Meal Advice Generated" width="240" height="500"/>    |


## About me
👤 **Name**: Mateo Tokić

🌐 **LinkedIn**: [Mateo Tokic](https://www.linkedin.com/in/mateo-toki%C4%87-67874a253/)

