import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const [values, setValues] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const validate = () => {
        const errors = {};
        if (!values.name) errors.name = "Name is required";
        if (!values.email) errors.email = "Email is required";
        if (!values.password) errors.password = "Password is required";
        return errors;
    };

    const navigate = useNavigate();
    axios.defaults.withCredentials = true;

    const handleSubmit = (event) => {
        event.preventDefault();
        setSubmitted(true);
        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            axios.post('http://localhost:8081/register', values)
                .then(res => {
                    if (res.data.Status === "Success") {
                        navigate('/login');
                    } else {
                        alert(res.data.Error || "Error occurred during registration.");
                    }
                })
                .catch(err => console.log(err));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value
        });
    };

    return (
        <div className='d-flex justify-content-center align-items-center bg-primary vh-100'>
            <div className='p-4 bg-white rounded'>
                <h2>Sign-Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label htmlFor='name'><strong>Name</strong></label>
                        <input
                            type='text'
                            placeholder='Enter Name'
                            name='name'
                            className='form-control rounded-0'
                            value={values.name}
                            onChange={handleChange}
                        />
                        {submitted && errors.name && <span className="text-danger">{errors.name}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor='email'><strong>Email</strong></label>
                        <input
                            type='email'
                            placeholder='Enter Email'
                            name='email'
                            className='form-control rounded-0'
                            value={values.email}
                            onChange={handleChange}
                        />
                        {submitted && errors.email && <span className="text-danger">{errors.email}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor='password'><strong>Password</strong></label>
                        <input
                            type='password'
                            placeholder='Enter Password'
                            name='password'
                            className='form-control rounded-0'
                            value={values.password}
                            onChange={handleChange}
                        />
                        {submitted && errors.password && <span className="text-danger">{errors.password}</span>}
                    </div>
                    <button type='submit' className='btn btn-success w-100 rounded-8'>Sign Up</button>
                    <Link to="/login" className='btn btn-default border w-100 bg-light rounded-0 mt-2'>Login</Link>
                </form>
            </div>
        </div>
    );
}

export default Register;
