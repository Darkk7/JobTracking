import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

function JobForm() {
  const [jobNumber, setJobNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState([]);  // State to hold the list of jobs
  const [editingJob, setEditingJob] = useState(null);  // State to track the job being edited

  // New state variables for additional fields
  const [dateInvoiced, setDateInvoiced] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [jobClosed, setJobClosed] = useState(false);

  // Fetch jobs when the component mounts
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs_closed')
        .select('*');  // Get all jobs

      if (error) {
        console.error('Error fetching jobs:', error.message);
      } else {
        if (Array.isArray(data)) {
          setJobs(data);  // Set jobs to the fetched data
        } else {
          console.error('Data is not an array:', data);
        }
      }
    };

    fetchJobs();
  }, []);  // Empty dependency array to run only once when the component mounts

  // Refresh function to fetch the latest jobs
  const handleRefresh = async () => {
    setMessage('');  // Clear any previous message

    // Fetch the latest jobs from the database
    const { data, error } = await supabase
      .from('jobs_closed')
      .select('*');

    if (error) {
      console.error('Error fetching jobs:', error.message);
      setMessage('Error fetching jobs. Please try again.');
    } else {
      if (Array.isArray(data)) {
        setJobs(data);  // Update the jobs state with the latest data
        setMessage('Jobs list refreshed successfully!');
      } else {
        console.error('Data is not an array:', data);
        setMessage('Error fetching jobs. Please try again.');
      }
    }
  };

  const handleDeleteAll = async () => {
    const batchSize = 100;  // Number of records to delete in each batch
    let currentOffset = 0;
    let totalDeleted = 0;
    let errorMessage = '';

    setMessage('');  // Clear any previous message

    // Get the total count of jobs
    const { count, error: countError } = await supabase
      .from('jobs_closed')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('Error fetching total job count:', countError);
      setMessage('Error fetching total job count');
      return;
    }

    while (currentOffset < count) {
      // Delete records in batches
      const { error } = await supabase
        .from('jobs_closed')
        .delete()
        .order('id', { ascending: true })  // Ensure a consistent order by id
        .range(currentOffset, currentOffset + batchSize - 1); // Deleting batch

      if (error) {
        console.error('Error deleting batch:', error);
        errorMessage = `Error deleting batch: ${error.message}`;
        break;
      }

      totalDeleted += batchSize;  // Increment the total number of deleted jobs
      currentOffset += batchSize;  // Move to the next batch
    }

    if (!errorMessage) {
      setJobs([]);  // Clear jobs from state
      setMessage(`All records deleted successfully!`);
    } else {
      setMessage(errorMessage);  // Display the error if something went wrong
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous message when submitting the form
    setMessage('');

    if (editingJob) {
      // Update the existing job in Supabase
      const { data, error } = await supabase
        .from('jobs_closed')
        .update({
          jobNumber,
          clientName,
          dateInvoiced,
          invoiceNumber,
          amount,
          jobClosed
        })
        .match({ id: editingJob.id });

      if (error) {
        console.error('Error updating job:', error.message);
        setMessage('Error updating job. Please try again.');
      } else {
        // Ensure `data` is an array before updating the state
        if (Array.isArray(data)) {
          setJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.id === editingJob.id
                ? { ...job, jobNumber, clientName, dateInvoiced, invoiceNumber, amount, jobClosed }
                : job
            )
          );
          setMessage('Job updated successfully!');
        } else {
          console.error('Data returned from update is not an array:', data);
        }
      }
      setEditingJob(null);  // Reset editing state
    } else {
      // Insert the data into your Supabase table (new job)
      const { data, error } = await supabase
        .from('jobs_closed')
        .insert([{
          jobNumber,
          clientName,
          dateInvoiced,
          invoiceNumber,
          amount,
          jobClosed
        }]);

      if (error) {
        console.error('Error inserting data:', error.message);
        setMessage('Error adding job. Please try again.');
      } else {
        // Ensure `data` is an array before updating the state
        if (Array.isArray(data)) {
          setJobs((prevJobs) => [...prevJobs, ...data]); // Add the new job(s)
          setMessage('Job added successfully!');
        } else {
          console.error('Data returned from insert is not an array:', data);
        }
      }
    }

    // Clear form fields after submission
    setJobNumber('');
    setClientName('');
    setDateInvoiced('');
    setInvoiceNumber('');
    setAmount('');
    setJobClosed(false);
  };

  const handleDelete = async (id) => {
    // Clear any previous message when deleting a job
    setMessage('');

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
    setDateInvoiced(job.dateInvoiced);
    setInvoiceNumber(job.invoiceNumber);
    setAmount(job.amount);
    setJobClosed(job.jobClosed);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printableContent');
    if (printContent) {  // Ensure the element exists before printing
      const newWindow = window.open('', '', 'width=800, height=600');
      newWindow.document.write('<html><head><title>Print Job List</title>');
      newWindow.document.write('<style>@media print {.actions-column {display: none;}}</style>');  // Hide actions column in print preview
      newWindow.document.write('</head><body>');
      newWindow.document.write(printContent.innerHTML);
      newWindow.document.write('</body></html>');
      newWindow.document.close();
      newWindow.print();
    } else {
      console.error('Printable content not found.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <img
          src="https://i.ibb.co/J3LGYhG/Industro-Plumbers-Logo.png"
          alt="Logo"
          style={styles.logo}
        />
        <h3>Once job has been added, <u>Refresh</u> the page to see it in the Job List table at the bottom</h3>
        <h2 style={styles.title}><u>{editingJob ? 'Edit Job' : 'Job Tracking'}</u></h2>
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
          <label style={styles.label}>
            Date Invoiced:
            <input
              type="date"
              value={dateInvoiced}
              onChange={(e) => setDateInvoiced(e.target.value)}
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Invoice Number:
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter Invoice Number"
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Amount:
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Job Closed:
            <input
              type="checkbox"
              checked={jobClosed}
              onChange={(e) => setJobClosed(e.target.checked)}
              style={styles.checkbox}
            />
          </label>
          <div style={styles.buttonContainer}>
            <button type="submit" style={styles.submitButton}>
              {editingJob ? 'Update Job' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <button onClick={handleRefresh} style={styles.refreshButton}>Refresh Jobs</button>
      <button onClick={handleDeleteAll} style={styles.deleteAllButton}>Delete All Jobs</button>

      <div id="printableContent" style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Job Number</th>
              <th>Client Name</th>
              <th>Date Invoiced</th>
              <th>Invoice Number</th>
              <th>Amount</th>
              <th>Job Closed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody style={styles.tableRows}>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.jobNumber}</td>
                <td>{job.clientName}</td>
                <td>{job.dateInvoiced}</td>
                <td>{job.invoiceNumber}</td>
                <td>{job.amount}</td>
                <td>{job.jobClosed ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => handleEdit(job)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(job.id)} style={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handlePrint} style={styles.printButton}>Print Job List</button>
    </div>
  );
}

const styles = {
  container: {
    margin: '0 auto',
    maxWidth: '800px',
    padding: '20px',
  },
  formCard: {
    marginBottom: '20px',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    backgroundColor: '#f9f9f9',
  },
  logo: {
    width: '100px',
    marginBottom: '10px',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '10px',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  checkbox: {
    marginTop: '5px',
  },
  buttonContainer: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  refreshButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteAllButton: {
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  message: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '16px',
    color: '#4CAF50',
  },
  tableWrapper: {
    marginTop: '30px',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'center',  // Ensures table content is center-aligned
  },
  tableRows: {
    textAlign: 'center',
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#FF9800',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  printButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default JobForm;
