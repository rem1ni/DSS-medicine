import React, { useState } from 'react';

import './App.css';

function Calculator() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [hypertension, setHypertension] = useState(false);
  const [heartDisease, setHeartDisease] = useState(false);
  const [smokingHistory, setSmokingHistory] = useState('never');
  const [bmi, setBmi] = useState('');
  const [hba1cLevel, setHba1cLevel] = useState('');
  const [bloodGlucoseLevel, setBloodGlucoseLevel] = useState('');
  const [result, setResult] = useState('');
  const [previousResults, setPreviousResults] = useState([]);
  const [image, setImage] = useState(null);

  const sendData = () => {
    const data = {
      gender,
      age,
      hypertension: hypertension ? 'on' : 'off',
      heartDisease: heartDisease ? 'on' : 'off',
      smokingHistory,
      bmi,
      hba1cLevel,
      bloodGlucoseLevel,
    };

    fetch('http://127.0.0.1:5000/calc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        setResult(data.result);
        setPreviousResults([data.result, ...previousResults]);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const sendImage = () => {
    if (image) {
      const formData = new FormData();
      formData.append('file', image);
  
      fetch('http://127.0.0.1:5000/image-calc', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            return response.json(); 
          }
          throw new Error('Network response was not ok.');
        })
        .then((data) => {
          const response = data.result; 
          setResult(response); 
          setPreviousResults([response, ...previousResults]); 
          console.log(response); 
        })
        .catch((error) => {
          console.error('There was an error with the image upload:', error);
        });
    } else {
      console.error('No image selected');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };


  return (
    <div className="container">
      <div className="tabs">
        <button onClick={() => handleTabChange('calculator')}>Риск диабета</button>
        <button onClick={() => handleTabChange('imageUpload')}>Наличие диабетической ретинопатии</button>
      </div>
      {activeTab === 'calculator' && (
          <div className="calculator">
            <h1>Риск диабета</h1>
          <div>
            <label htmlFor="gender">Пол</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Мужчина</option>
              <option value="female">Женщина</option>
            </select>
          </div>
          <div>
            <label htmlFor="age">Возраст</label>
            <input type="text" id="age" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label>Гипертония</label>
            <input type="checkbox" id="hypertension" checked={hypertension} onChange={() => setHypertension(!hypertension)} />
          </div>
          <div>
            <label>Заболевание сердца</label>
            <input type="checkbox" id="heart_disease" checked={heartDisease} onChange={() => setHeartDisease(!heartDisease)} />
          </div>
          <div>
            <label htmlFor="smoking_history">История курения</label>
            <select id="smoking_history" value={smokingHistory} onChange={(e) => setSmokingHistory(e.target.value)}>
              <option value="never">Никогда</option>
              <option value="No Info">Нет информации</option>
              <option value="current">Курит</option>
              <option value="former">Пассивный курильщик</option>
              <option value="ever">Редко</option>
              <option value="not current">Бросил</option>
            </select>
          </div>
          <div>
            <label htmlFor="bmi">Индекс массы тела</label>
            <input type="text" id="bmi" value={bmi} onChange={(e) => setBmi(e.target.value)} />
          </div>
          <div>
            <label htmlFor="HbA1c_level">Уровень HbA1c %</label>
            <input type="text" id="HbA1c_level" value={hba1cLevel} onChange={(e) => setHba1cLevel(e.target.value)} />
          </div>
          <div>
            <label htmlFor="blood_glucose_level">Уровень глюкозы в крови мг/дл</label>
            <input type="text" id="blood_glucose_level" value={bloodGlucoseLevel} onChange={(e) => setBloodGlucoseLevel(e.target.value)} />
          </div>
          <button onClick={sendData}>Рассчитать</button>
        </div>
      )}
      {activeTab === 'imageUpload' && (
        <div className="image-upload-tab">
          <h1>Определить по фото</h1>
          <div>
            <input type="file" accept="image/jpeg" onChange={handleImageChange} />
          </div>
          <div>
            <button onClick={sendImage}>Загрузить изображение</button>
          </div>
        </div>
      )}
      <div className="result-container">
        <h2>Результат</h2>
        <div id="result">{result}</div>
        <div id="previous-results">
          <h3>Предыдущие результаты</h3>
          <ul id="previous-results-list">
            {previousResults.map((res, index) => (
              <li key={index}>{res}</li>
            ))}
          </ul>
      </div>
    </div>
  </div>
  );
}
export default Calculator;