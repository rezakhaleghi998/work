import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, metricsRes, rankingsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/metrics/all'),
        axios.get('/api/metrics/rankings')
      ]);

      setUsers(usersRes.data);
      setMetrics(metricsRes.data);
      setRankings(rankingsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="tracker-container">
        <div className="text-center mb-4">
          <h1 className="text-primary">👑 Admin Dashboard</h1>
          <p className="text-muted">Manage users and view system analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h3>{users.length}</h3>
                <p className="mb-0">Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h3>{metrics.length}</h3>
                <p className="mb-0">Total Workouts</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h3>{metrics.reduce((sum, m) => sum + (m.caloriesBurned || 0), 0)}</h3>
                <p className="mb-0">Total Calories</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h3>{rankings.length}</h3>
                <p className="mb-0">Active Rankings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users Management
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              Workout Metrics
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'rankings' ? 'active' : ''}`}
              onClick={() => setActiveTab('rankings')}
            >
              User Rankings
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.age}</td>
                    <td>{user.gender}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.email !== 'demo' && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Workout Type</th>
                  <th>Duration</th>
                  <th>Intensity</th>
                  <th>Calories Burned</th>
                  <th>Fitness Index</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 50).map(metric => (
                  <tr key={metric.id}>
                    <td>{metric.User?.firstName} {metric.User?.lastName}</td>
                    <td>{metric.workoutType}</td>
                    <td>{metric.duration} min</td>
                    <td>
                      <span className={`badge ${
                        metric.intensity === 'high' ? 'bg-danger' : 
                        metric.intensity === 'medium' ? 'bg-warning' : 'bg-success'
                      }`}>
                        {metric.intensity}
                      </span>
                    </td>
                    <td>{metric.caloriesBurned}</td>
                    <td>{metric.fitnessIndex}</td>
                    <td>{new Date(metric.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Total Score</th>
                  <th>Total Calories</th>
                  <th>Avg Fitness Index</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((ranking, index) => (
                  <tr key={ranking.id}>
                    <td>
                      <span className={`badge ${
                        index === 0 ? 'bg-warning' : 
                        index === 1 ? 'bg-secondary' : 
                        index === 2 ? 'bg-dark' : 'bg-primary'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>{ranking.User?.firstName} {ranking.User?.lastName}</td>
                    <td>{ranking.totalScore}</td>
                    <td>{ranking.totalCalories}</td>
                    <td>{ranking.averageFitnessIndex}</td>
                    <td>{new Date(ranking.lastActivity).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
