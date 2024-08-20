import React, { useState } from 'react';
import styles from './Form.module.css';
import imageCompression from 'browser-image-compression';
import { BarLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB

const Form: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    age: '',
    role: '',
    company: '',
    image: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    name: '',
    age: '',
    role: '',
    company: '',
    image: ''
  });

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'aaludra.com'];
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return 'Only Aaludra, Gmail, Yahoo, and Outlook domains are allowed';
    }
    return null;
  };

  const validateName = (name: string): string | null => {
    if (name.length > 50) {
      return 'Name should be maximum 50 characters long';
    }
    return null;
  };

  const validateAge = (age: string): string | null => {
    if (!/^\d{2,3}$/.test(age)) {
      return 'Age should be a number with 2 or 3 digits';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<any>): void => {
    const { name, value, files } = e.target;
    let error = '';

    if (name === 'email') {
      error = validateEmail(value) || '';
    } else if (name === 'name') {
      error = validateName(value) || '';
    } else if (name === 'age') {
      error = validateAge(value) || '';
    } else if (name === 'image' && files) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        error = 'Only image files are allowed';
      } else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        error = `File size should not exceed ${MAX_FILE_SIZE_MB} MB`;
      }
    }

    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });

    setErrors({
      ...errors,
      [name]: error
    });
  };

  const validateFormData = (): { email: string; name: string; age: string; role: string; company: string; image: string } => {
    const errorMessages: { email: string; name: string; age: string; role: string; company: string; image: string } = {
      email: '',
      name: '',
      age: '',
      role: '',
      company: '',
      image: ''
    };

    const emailError = validateEmail(formData.email);
    if (emailError) {
      errorMessages.email = emailError;
    }

    const nameError = validateName(formData.name);
    if (nameError) {
      errorMessages.name = nameError;
    }

    const ageError = validateAge(formData.age);
    if (ageError) {
      errorMessages.age = ageError;
    }

    if (!formData.role) {
      errorMessages.role = 'Role is required';
    }

    if (!formData.company) {
      errorMessages.company = 'Company is required';
    }

    if (!formData.image) {
      errorMessages.image = 'Image is required';
    } else if (!formData.image.type.startsWith('image/')) {
      errorMessages.image = 'Only image files are allowed';
    } else if (formData.image.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      errorMessages.image = `File size should not exceed ${MAX_FILE_SIZE_MB} MB`;
    }

    return errorMessages;
  };



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true); // Start the loader

    // Validate form data
    const errorMessages = validateFormData();
    setErrors(errorMessages);
    const hasErrors = Object.values(errorMessages).some((error) => error !== '');

    if (hasErrors) {
      toast.error('Please fix the errors in the form');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('email', formData.email.trim().toLowerCase());
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('age', formData.age.trim());
    formDataToSend.append('role', formData.role.trim());
    formDataToSend.append('companyname', formData.company.trim());

    if (formData.image) {
      const compressedImage = await imageCompression(formData.image, {
        maxSizeMB: 1, // Adjust the maximum size in MB as needed
        maxWidthOrHeight: 1920, // Adjust the maximum width or height as needed
        useWebWorker: true,
      });
      formDataToSend.append('file', compressedImage);
    }

    try {
      const response = await fetch('https://chat-backend-ez0j.onrender.com/add_user', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        console.log('Form submitted successfully');
        const responseData = await response.json();
        localStorage.setItem('userData', JSON.stringify(responseData));
        setIsSubmitted(true);
        toast.success('Form submitted successfully!');
        setFormData({
          email: '',
          name: '',
          age: '',
          role: '',
          company: '',
          image: null as File | null,
        });
        setTimeout(() => {
          window.location.reload();
          window.location.href = '/export'; // Redirect to home page if no data found
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData.message || errorData.error);
        if (response.status === 400) {
          toast.error(errorData.message || 'User already exists');
        } else {
          toast.error('Error submitting form: ' + errorData.message);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false); // Stop the loader
    }
  };

  return (
    <div id='main'>
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <BarLoader color="#36d7b7" />
          </div>
        )}
        <form onSubmit={handleSubmit} className={`${styles.form} ${loading ? styles.loading : ''}`}>
          <h2 className={styles.heading}>Submit Your Details</h2>
          <div>
            <label className={styles.label}><span className={styles.error}> * </span>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
              readOnly={isSubmitted} // Make input read-only after submission
            />
            {errors.email && <div className={styles.error}>{errors.email}</div>}
          </div>
          <div>
            <label className={styles.label}><span className={styles.error}> * </span>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={50}
              required
              className={styles.input}
              readOnly={isSubmitted} // Make input read-only after submission
            />
            {errors.name && <div className={styles.error}>{errors.name}</div>}
          </div>
          <div>
            <label className={styles.label}><span className={styles.error}> * </span>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min={1}
              max={999}
              required
              className={styles.input}
              readOnly={isSubmitted} // Make input read-only after submission
            />
            {errors.age && <div className={styles.error}>{errors.age}</div>}
          </div>
          <div>
            <label className={styles.label}><span className={styles.error}> * </span>Role</label>
            <div className={styles.inputGroup}>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={styles.input}
                disabled={isSubmitted}
              >
                <option value="">Select a role</option>
                <option value="intern">Intern</option>
                <option value="developer">Developer</option>
                <option value="manager">Manager</option>
                <option value="designer">Designer</option>
              </select>
              {formData.role === 'other' && (
                <input
                  type="text"
                  name="roleOther"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  placeholder="Enter role"
                  className={styles.input}
                  readOnly={isSubmitted}
                />
              )}
            </div>
            {errors.role && <div className={styles.error}>{errors.role}</div>}
          </div>
          <div>
            <label className={styles.label}><span className={styles.error}> * </span>Company</label>
            <select
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className={styles.input}
              disabled={isSubmitted}
            >
              <option value="">Select a company</option>
              <option value="Aaludra Technology Solutions">Aaludra Technology Solutions</option>
              <option value="Google">Google</option>
              <option value="Amazon">Amazon</option>
            </select>
            {errors.company && <div className={styles.error}>{errors.company}</div>}
          </div>
          <div>
            <label className={styles.label}>Upload Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              required
              className={styles.fileInput}
              disabled={isSubmitted}
            />
            {errors.image && <div className={styles.error}>{errors.image}</div>}
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={loading}>
              Submit
            </button>
          </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Form;
