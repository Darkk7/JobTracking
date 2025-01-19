import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

function JobForm() {
  const [jobNumber, setJobNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState([]);  // State to hold the list of jobs
  const [editingJob, setEditingJob] = useState(null);  // State to track the job being edited

  // Fetch jobs when the component mounts
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs_closed')
        .select('*');  // Get all jobs

      if (error) {
        console.error('Error fetching jobs:', error.message);
      } else {
        setJobs(data);  // Set jobs to the fetched data
      }
    };

    fetchJobs();
  }, []);  // Empty dependency array to run only once when the component mounts

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingJob) {
      // Update the existing job in Supabase
      const { data, error } = await supabase
        .from('jobs_closed')
        .update({ jobNumber: jobNumber, clientName: clientName })
        .match({ id: editingJob.id });

      if (error) {
        console.error('Error updating job:', error.message);
        setMessage('Error updating job. Please try again.');
      } else {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === editingJob.id ? { ...job, jobNumber, clientName } : job
          )
        );
        setMessage('Job updated successfully!');
      }
      setEditingJob(null);  // Reset editing state
    } else {
      // Insert the data into your Supabase table (new job)
      const { data, error } = await supabase
        .from('jobs_closed')
        .insert([{ jobNumber: jobNumber, clientName: clientName }]);

      if (error) {
        console.error('Error inserting data:', error.message);
        setMessage('Error adding job. Please try again.');
      } else {
        setJobs((prevJobs) => [...prevJobs, ...data]);
        setMessage('Job added successfully!');
      }
    }

    setJobNumber('');
    setClientName('');
  };

  const handleDelete = async (id) => {
    // Delete the job from Supabase
    const { error } = await supabase
      .from('jobs_closed')
      .delete()
      .match({ id: id });

    if (error) {
      console.error('Error deleting job:', error.message);
      setMessage('Error deleting job. Please try again.');
    } else {
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
      setMessage('Job deleted successfully!');
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setJobNumber(job.jobNumber);
    setClientName(job.clientName);
  };

  return (
    <div style={styles.container}>
      <h2>{editingJob ? 'Edit Job' : 'Add Job'}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Job Number:
          <input
            type="text"
            value={jobNumber}
            onChange={(e) => setJobNumber(e.target.value)}
            placeholder="Enter Job Number"
            style={styles.input}
            required
          />
        </label>
        <label style={styles.label}>
          Client Name:
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter Client Name"
            style={styles.input}
            required
          />
        </label>
        <button type="submit" style={styles.button}>
          {editingJob ? 'Update' : 'Submit'}
        </button>
      </form>
      {message && <p style={styles.message}>{message}</p>}

      {/* Table to display the jobs */}
      <h3>Job List</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Job Number</th>
            <th>Client Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.jobNumber}</td>
              <td>{job.clientName}</td>
              <td>
                <button
                  onClick={() => handleEdit(job)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  label: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  input: {
    padding: '10px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  message: {
    marginTop: '20px',
    color: 'green',
    fontWeight: 'bold',
  },
  table: {
    marginTop: '30px',
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #ccc',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
  },
  th: {
    padding: '10px',
    textAlign: 'left',
    border: '1px solid #ccc',
  },
  td: {
    padding: '10px',
    border: '1px solid #ccc',
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#FFC107',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#DC3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default JobForm;
