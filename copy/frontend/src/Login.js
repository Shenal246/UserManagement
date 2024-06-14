import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {

  const [values, setValues] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  const handleSubmit = (event) => {
    event.preventDefault();

    if (Object.keys(errors).length === 0) {
      axios.post('http://localhost:8081/login', values)
        .then(res => {
          if (res.data.Status === "Success") {
            navigate('/')
          } else {
            alert(res.data.Error);
          }
        })
        .catch(err => console.log(err));
    } else {
      setErrors(errors);
    }
  };

  return (
    <div className='d-flex justify-content-center align-items-center bg-primary vh-100'>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-3'>
          <label htmlFor='name'><strong>Email</strong></label>
          <input type='email' placeholder='Enter Email' name='email'
            onChange={e => setValues({ ...values, email: e.target.value })}
            className='form-control rounded-0' />
        </div>
        <div className='mb-3'>
          <label htmlFor='name'><strong>Password</strong></label>
          <input type='password' placeholder='Enter Password' name='password'
            onChange={e => setValues({ ...values, password: e.target.value })}
            className='form-control rounded-0' />
        </div>
        <button type='submit' className='btn btn-success w-100 rounded-8'>Login</button>
        <Link to="/register" className='btn btn-default border w-100 bg-light rounded-0'>Create Account</Link>
      </form>

    </div>
  )
}

export default Login;