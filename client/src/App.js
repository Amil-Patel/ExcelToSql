// import React, { useState } from 'react';
// import axios from 'axios';
// import './App.css';

// function App() {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [dob, setDob] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('http://localhost:3001/generate-password', {
//         firstName,
//         lastName,
//         dob
//       });
//       console.log(response)
//       setPassword(response.data.password);
//     } catch (error) {
//       console.error('Error generating password', error);
//     }
//   };

//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Password Generator</h1>
//         <form onSubmit={handleSubmit}>
//           <div>
//             <label> 
//               First Name:
//               <input
//                 type="text"
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//                 required
//               />
//             </label>
//           </div>
//           <div>
//             <label>
//               Last Name:
//               <input
//                 type="text"
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//                 required
//               />
//             </label>
//           </div>
//           <div>
//             <label>
//               Date of Birth:
//               <input
//                 type="date"
//                 value={dob}
//                 onChange={(e) => setDob(e.target.value)}
//                 required
//               />
//             </label>
//           </div>
//           <button type="submit">Generate Password</button>
//         </form>
//         {password && (
//           <div>
//             <h2>Generated Password:</h2>
//             <p style={{ color: 'red' }}>{password}</p>
//           </div>
//         )}
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:1009/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div>
      <h1>Upload Excel File</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
    </div>
  );
};

export default App;

