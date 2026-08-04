const axios = require('axios');
async function run() {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTY5YTA2YzljMGEyMTAyMTBlOGQ1NWMiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg1MzA3NDk2LCJleHAiOjE3ODUzMDgzOTZ9.wKkpC2bOl02GeCeiD9v2eGgg2v-9bCt9FcskMCZ4DxY";
  const res = await axios.get('http://localhost:4000/api/cart', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Cart output:", res.data);
}
run();
