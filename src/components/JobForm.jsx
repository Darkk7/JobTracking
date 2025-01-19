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
              onChange={() => setJobClosed(!jobClosed)}
              style={styles.checkbox}
            />
          </label>
          <button type="submit" style={styles.button}>
            {editingJob ? 'Update' : 'Submit'}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}

        {/* Print Button */}
        <button onClick={handlePrint} style={styles.printButton}>
        Print Job List
        </button>

        {/* Refresh Button */}
        <button onClick={() => window.location.reload()} style={{ backgroundColor: '#FFBF00', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '5px', marginTop: '20px', width: '80%' }}>
        Refresh
        </button>

        {/* Delete All Records Button */}
        <button onClick={handleDeleteAll} style={{ backgroundColor: '#F44336', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '5px', marginTop: '20px', width: '80%' }}>
        Delete All Records
        </button>
      </div>

      {/* Table below the form */}
      {jobs.length > 0 && (
        <div id="printableContent" style={styles.tableContainer}>
          <h3>Job List</h3>
          <div style={styles.table}>
            <div style={styles.tableRow}>
              <div style={styles.tableHeader}>Job Number</div>
              <div style={styles.tableHeader}>Client Name</div>
              <div style={styles.tableHeader}>Date Invoiced</div>
              <div style={styles.tableHeader}>Invoice Number</div>
              <div style={styles.tableHeader}>Amount</div>
              <div style={styles.tableHeader}>Job Closed</div>
              <div style={styles.tableHeader}>Actions</div>
            </div>
            {jobs.map((job) => (
              <div key={job.id} style={styles.tableRow}>
                <div style={styles.tableCell}>{job.jobNumber}</div>
                <div style={styles.tableCell}>{job.clientName}</div>
                <div style={styles.tableCell}>{job.dateInvoiced}</div>
                <div style={styles.tableCell}>{job.invoiceNumber}</div>
                <div style={styles.tableCell}>{job.amount}</div>
                <div style={styles.tableCell}>{job.jobClosed ? 'Yes' : 'No'}</div>
                <div style={styles.tableCell}>
                  <button style={styles.editButton} onClick={() => handleEdit(job)}>Edit</button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(job.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',  // Align items from the top
      height: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      overflowY: 'auto',  // Ensure scrolling if content overflows
    },
    formCard: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '20px',  // Space between form and table
    },
    logo: {
      display: 'block',
      margin: '0 auto 20px',
      width: '150px',
    },
    title: {
      textAlign: 'center',
      fontSize: '1.5rem',
      marginBottom: '20px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      alignItems: 'center',
    },
    label: {
      fontSize: '1rem',
      marginBottom: '10px',
      width: '100%',
      textAlign: 'center',
    },
    input: {
      padding: '10px',
      marginBottom: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      width: '80%',
      textAlign: 'center',
    },
    checkbox: {
      marginBottom: '10px',
    },
    button: {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '10px',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '5px',
      width: '80%',
      textAlign: 'center',
    },
    printButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '5px',
      marginTop: '20px',
      width: '80%',
    },
    message: {
      color: 'green',
      marginTop: '10px',
    },
    tableContainer: {
      marginTop: '30px',
      width: '100%',
      maxWidth: '800px',
      marginBottom: '20px',  // Add spacing between table and bottom of page
    },
    table: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      padding: '10px',
    },
    tableRow: {
      display: 'contents',
    },
    tableHeader: {
      fontWeight: 'bold',
      textAlign: 'center',
      padding: '10px',
      backgroundColor: '#f4f4f4',
      border: '1px solid #ddd',
    },
    tableCell: {
      textAlign: 'center',
      padding: '10px',
      border: '1px solid #ddd',
    },
    editButton: {
      backgroundColor: '#FF9800',
      color: 'white',
      padding: '5px 10px',
      border: 'none',
      cursor: 'pointer',
      marginRight: '5px',
      borderRadius: '5px',
    },
    deleteButton: {
      backgroundColor: '#F44336',
      color: 'white',
      padding: '5px 10px',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '5px',
    },
  };  

export default JobForm;