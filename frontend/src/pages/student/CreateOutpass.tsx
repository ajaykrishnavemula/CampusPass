import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-hot-toast';
import { outpassService } from '../../services/outpassService';
import { useAuthStore } from '../../store/authStore';

const CreateOutpass: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    reason: '',
    purpose: '',
    destination: '',
    emergencyContact: '',
  });
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if user has permission to create outpass
    if (!user?.canCreateOutpass) {
      toast.error('Please contact admin to enable outpass creation permission');
      return;
    }

    // Validation
    if (!departureDate) {
      setError('Please select departure date and time');
      return;
    }
    if (!returnDate) {
      setError('Please select return date and time');
      return;
    }

    if (departureDate >= returnDate) {
      setError('Return date/time must be after departure date/time');
      return;
    }

    if (departureDate < new Date()) {
      setError('Departure date/time cannot be in the past');
      return;
    }

    setLoading(true);

    try {
      const outpassData = {
        reason: formData.reason,
        destination: formData.destination,
        fromDate: departureDate.toISOString(),
        toDate: returnDate.toISOString(),
        purpose: formData.purpose,
        emergencyContact: formData.emergencyContact,
      };

      const response = await outpassService.createOutpass(outpassData);
      navigate(`/student/outpass/${response._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create outpass. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Outpass</h1>
          <p className="text-sm text-gray-600 mt-1">Fill in the details to request an outpass</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose *
            </label>
            <select
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Purpose</option>
              <option value="home">Home Visit</option>
              <option value="medical">Medical</option>
              <option value="personal">Personal Work</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Outpass *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              minLength={10}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Please provide a detailed reason (minimum 10 characters)"
            />
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Destination *
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter destination address"
            />
          </div>

          {/* Date and Time with DatePicker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date & Time *
              </label>
              <DatePicker
                selected={departureDate}
                onChange={(date: Date | null) => {
                  setDepartureDate(date);
                  setError('');
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy h:mm aa"
                minDate={new Date()}
                placeholderText="Select departure date & time"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Click to open calendar and time selector</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Date & Time *
              </label>
              <DatePicker
                selected={returnDate}
                onChange={(date: Date | null) => {
                  setReturnDate(date);
                  setError('');
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy h:mm aa"
                minDate={departureDate || new Date()}
                placeholderText="Select return date & time"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be after departure date & time</p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Number *
            </label>
            <input
              type="tel"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="9876543210 (10 digits only)"
            />
            <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number without country code</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Outpass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOutpass;

// 
