import axios from 'axios'
import './App.css';


const bufferToBase64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

const removeCredential = () => {
  localStorage.removeItem('credential');

};

const apiUrl = 'http://localhost:8000';

const register = async () => {

  try {
    const { data: credentialCreationOptions } = await axios.get(`${apiUrl}/registration-options`, { withCredentials: true })
    console.log('credentialCreationOptions : ', credentialCreationOptions)

    credentialCreationOptions.challenge = new Uint8Array(credentialCreationOptions.challenge.data);
    credentialCreationOptions.user.id = new Uint8Array(credentialCreationOptions.user.id.data);
    credentialCreationOptions.user.name = 'pwa@example.com';
    credentialCreationOptions.user.displayName = 'What PWA Can Do Today';

    const credential = await navigator.credentials.create({
      publicKey: credentialCreationOptions
    });

    const credentialId = bufferToBase64(credential.rawId);

    localStorage.setItem('credential', JSON.stringify({ credentialId }));

    const data = {
      rawId: credentialId,
      response: {
        attestationObject: bufferToBase64(credential.response.attestationObject),
        clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        id: credential.id,
        type: credential.type
      }
    };

    await axios.post(`${apiUrl}/register`, { credential: data, }, { withCredentials: true })


  }
  catch (e) {
    console.error('registration failed', e);
  }
  finally {

  }
};

const authenticate = async () => {

  try {
    const { data: credentialRequestOptions } = await axios.get(`${apiUrl}/authentication-options`, { withCredentials: true })

    const { credentialId } = JSON.parse(localStorage.getItem('credential'));

    credentialRequestOptions.challenge = new Uint8Array(credentialRequestOptions.challenge.data);
    credentialRequestOptions.allowCredentials = [
      {
        id: base64ToBuffer(credentialId),
        type: 'public-key',
        transports: ['internal']
      }
    ];

    const credential = await navigator.credentials.get({
      publicKey: credentialRequestOptions
    });

    const data = {
      rawId: bufferToBase64(credential.rawId),
      response: {
        authenticatorData: bufferToBase64(credential.response.authenticatorData),
        signature: bufferToBase64(credential.response.signature),
        userHandle: bufferToBase64(credential.response.userHandle),
        clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        id: credential.id,
        type: credential.type
      }
    };

    const { data: response } = await axios.post(`${apiUrl}/authenticate`, { credential: data }, { withCredentials: true })

    if (response.status === 404) {
      removeCredential();
    }
    else {
      const assertionResponse = response
      console.log('assertionResponse : ', assertionResponse)
    }
  }
  catch (e) {
    console.error('authentication failed', e);


  }
  finally {

  }
};

function App() {
  return (
    <div className="App">
      <button onClick={register}>register</button>
      <button onClick={authenticate}>authenticate</button>
    </div>
  );
}

export default App;
