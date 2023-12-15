from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from keras.models import load_model
from sklearn.preprocessing import StandardScaler
import pickle
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms

class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, stride=1, padding=0)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=0)
        self.pool = nn.AvgPool2d(kernel_size=2, stride=2)
        self.fc1 = nn.Linear(32 * 30 * 30, 128)
        self.fc2 = nn.Linear(128, 2)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(-1, 32 * 30 * 30)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x
model_CNN = SimpleCNN()
app = Flask(__name__)
CORS(app)

model = load_model('mlp_model_v1') 
model_CNN.load_state_dict(torch.load('trained_model_CNN.pth'))
scaler = pickle.load(open('scaler.sav', 'rb'))
class_names = ['нет диабета', 'есть диабет']

def prepareVector(data):
    gender = data.get('gender')
    age = data.get('age')
    hypertension = data.get('hypertension')
    heart_disease = data.get('heartDisease')
    smoking_history = data.get('smokingHistory')
    bmi = data.get('bmi')
    HbA1c_level = data.get('hba1cLevel')
    blood_glucose_level = data.get('bloodGlucoseLevel')

    df = pd.DataFrame({
        'gender': [gender],
        'age': [age],
        'hypertension': [hypertension],
        'heart_disease': [heart_disease],
        'smoking_history': [smoking_history],
        'bmi': [bmi],
        'HbA1c_level': [HbA1c_level],
        'blood_glucose_level': [blood_glucose_level]
    })
    df['smoking_history'].replace(['never', 'No Info', 'current', 'former', 'ever', 'not current'], [0, 1, 2, 3, 4, 5], inplace=True)
    df['gender'].replace(['male', 'female'], [0, 1], inplace=True)
    df['hypertension'].replace(['off', 'on'], [0, 1], inplace=True)
    df['heart_disease'].replace(['off', 'on'], [0, 1], inplace=True)
    df[['smoking_history', 'blood_glucose_level']] = df[['smoking_history', 'blood_glucose_level']].astype(float)
    df[['gender', 'hypertension', 'heart_disease']] = df[['gender', 'hypertension', 'heart_disease']].astype(bool)
    scaler_vector = scaler.transform(df.values.reshape(-1, 8))
    return scaler_vector, df


@app.route('/calc', methods=['POST'])
def calc():
    data = request.json
    vector, df = prepareVector(data)
    pred = model.predict(vector)
    print(pred)
    result = f"Риск диабета {100*pred[0][1]:.2f}%"
    return jsonify({'result': result}) 

@app.route('/image-calc', methods=['POST'])
def image_calc():
    if 'file' not in request.files:
        return jsonify({'result': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'result': 'No selected file'})

    if file:
        file.save('uploaded_image.jpg')
        image = Image.open('uploaded_image.jpg')
        transform = transforms.Compose([
            transforms.Resize((128,128)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),  # Нормализация
        ])
        transformed_image = transform(image)
        matrix = torch.cat([transformed_image], dim = 0)
        pred = model_CNN(matrix)
        probs = F.softmax(pred, dim=1)
        result = f"Риск диабетической ретинопатии {100*probs[0][0].item():.2f}%"
        return jsonify({'result': result})
    
if __name__ == '__main__':
    app.run(debug=True)