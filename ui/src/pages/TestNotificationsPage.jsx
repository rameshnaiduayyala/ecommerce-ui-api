import React, { useState } from 'react';
import { pushService } from '../notifications/pushService';
import { EmailTemplates } from '../notifications/emailService';

const TestNotificationsPage = () => {
  const [emailStatus, setEmailStatus] = useState('');
  const [email, setEmail] = useState('');
  const [pushStatus, setPushStatus] = useState('');

  const handlePushTest = async () => {
    try {
      await pushService.requestPermission();
      alert('Requested push permission! Check if a prompt appeared or if you are already subscribed.');
    } catch (error) {
      console.error(error);
      alert('Error requesting push permission: ' + error.message);
    }
  };

  const handleSendTestPush = async (target) => {
    setPushStatus(`Sending push notification to '${target}'...`);
    try {
      const response = await pushService.sendPushNotification({
        userId: target === 'me' ? 'all' : target, // target all subscribed for simple testing
        title: '🔔 Test Notification!',
        message: 'This is a premium OneSignal push notification from Aha Konaseema!',
        url: window.location.origin
      });
      setPushStatus(`Success! Response: ` + JSON.stringify(response));
    } catch (err) {
      console.error(err);
      setPushStatus(`Failed to send push notification. Note: OneSignal REST API key is required. Error: ` + err.message);
    }
  };

  const handleTestEmailTemplate = async (type) => {
    if (!email) {
      alert('Please enter an email address to test.');
      return;
    }
    
    setEmailStatus(`Sending ${type} test email...`);
    try {
      let response;
      const dummyOrderDetails = {
        orderId: 'ord-test-99999',
        date: new Date().toISOString(),
        customerName: 'Aha Tester',
        shippingAddress: '123 Sweet Street, Ravulapalem, AP, 533238',
        phone: '+91 99999 88888',
        items: [
          {
            name: 'Special Kakinada Kaja',
            image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=120&q=80',
            quantity: 2,
            price: 350
          },
          {
            name: 'Dry Fruit Pootharekulu',
            image_url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=120&q=80',
            quantity: 1,
            price: 490
          }
        ],
        subtotal: 1190,
        discount: 100,
        shipping: 0,
        grandTotal: 1090,
        paymentMethod: 'Prepaid',
        origin: window.location.origin
      };

      if (type === 'welcome') {
        response = await EmailTemplates.sendWelcomeEmail(email, 'Aha Tester');
      } else if (type === 'otp') {
        response = await EmailTemplates.sendOTP(email, '884920');
      } else if (type === 'order_confirmation') {
        response = await EmailTemplates.sendOrderConfirmation(email, dummyOrderDetails);
      } else if (type === 'admin_alert') {
        response = await EmailTemplates.sendAdminNewOrderAlert(email, dummyOrderDetails);
      } else if (type === 'status_update') {
        response = await EmailTemplates.sendOrderStatusUpdate(email, dummyOrderDetails, 'shipped', 'Out for premium delivery via Ghee Express!');
      } else if (type === 'password_reset') {
        response = await EmailTemplates.sendPasswordReset(email, `${window.location.origin}/reset-password?token=test-token`);
      }

      setEmailStatus(`Success sending ${type}! Response: ` + JSON.stringify(response));
    } catch (error) {
      console.error(error);
      setEmailStatus(`Failed to send ${type}. Note: Resend blocks client-side API calls due to CORS. If you see a CORS error, your credentials are valid but you must call it from the server backend. Error: ` + error.message);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 bg-gray-900 text-foreground min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Test Notifications</h1>
      
      {/* Push Notifications Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-purple-400">1. Test OneSignal Push</h2>
        <p className="mb-4 text-muted-foreground">
          This will prompt the browser for push permissions. You should also see a floating bell icon in the bottom right if OneSignal initialized correctly.
        </p>
        <div className="flex flex-wrap gap-4 mb-4">
          <button 
            onClick={handlePushTest}
            className="bg-purple-600 hover:bg-purple-700 text-foreground px-4 py-2 rounded shadow transition text-xs font-bold"
          >
            Prompt Push Permission
          </button>
          <button 
            onClick={() => handleSendTestPush('me')}
            className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-4 py-2 rounded shadow transition text-xs font-bold"
          >
            🔔 Send Test Push (All Subscribed)
          </button>
        </div>
        {pushStatus && (
          <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700 text-sm text-muted-foreground break-all">
            {pushStatus}
          </div>
        )}
      </div>

      {/* Email Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">2. Test React-Email Templates</h2>
        <p className="mb-4 text-muted-foreground">
          Enter an email address and click any template below to render and send a gorgeous responsive test email!
        </p>
        <div className="flex space-x-4 mb-6">
          <input 
            type="email" 
            placeholder="your-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-900 border border-gray-600 rounded px-3 py-2 flex-grow text-foreground"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={() => handleTestEmailTemplate('welcome')}
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 font-bold px-4 py-2.5 rounded transition text-xs"
          >
            👋 Welcome Email
          </button>
          <button 
            onClick={() => handleTestEmailTemplate('otp')}
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 font-bold px-4 py-2.5 rounded transition text-xs"
          >
            🔑 OTP Login Email
          </button>
          <button 
            onClick={() => handleTestEmailTemplate('order_confirmation')}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold px-4 py-2.5 rounded transition text-xs"
          >
            🛍️ Order Confirmation
          </button>
          <button 
            onClick={() => handleTestEmailTemplate('admin_alert')}
            className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 font-bold px-4 py-2.5 rounded transition text-xs"
          >
            🚨 Admin New Order Alert
          </button>
          <button 
            onClick={() => handleTestEmailTemplate('status_update')}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold px-4 py-2.5 rounded transition text-xs"
          >
            📦 Status Update (Shipped)
          </button>
          <button 
            onClick={() => handleTestEmailTemplate('password_reset')}
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 font-bold px-4 py-2.5 rounded transition text-xs"
          >
            🔒 Password Reset
          </button>
        </div>

        {emailStatus && (
          <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-700 text-sm text-muted-foreground break-all">
            {emailStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestNotificationsPage;
