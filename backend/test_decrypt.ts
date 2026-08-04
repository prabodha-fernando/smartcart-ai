import axios from 'axios';

async function run() {
    try {
        const res = await axios.get('http://localhost:4000/api/products?limit=12&skip=0');
        console.log("Raw output type:", typeof res.data);
        console.log("Raw output keys:", Object.keys(res.data));
    } catch(err) {
        console.error(err);
    }
}
run();
