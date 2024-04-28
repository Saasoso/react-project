import './Chat.css'
import React, { useState, useRef, useEffect } from 'react';


const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [output, setFileOutput] = useState('');
  const chatRef = useRef(null);
  const [file, setFile] = useState();


  // Sample data for AI responses (replace with your logic)
  const aiResponses = {
    "hello": "Hi there! How can I help you today?",
    "how are you": "I'm doing well, thanks for asking! How about you?",
    "default": "Sorry, I didn't quite understand that. Could you rephrase?"
  };

  const handleUserInput = (e) => {setUserInput(e.target.value);};

  const sendMessage = async () => {
    if (userInput.trim() !== '') {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'user', message: userInput },
      ]);
      setUserInput('');
  
      if (file) {
        const fileName = file.name;
        const filePath = `uploads/${fileName}`;
  
        const processResponse = await fetch('http://localhost:3000/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath, userInput }),
        });
  
        if (processResponse.ok) {
          const { output } = await processResponse.json();
          console.log('Output:', output);
          setFileOutput(output);
          setMessages((prevMessages) => [
            ...prevMessages,
            { type: 'ai', message: output },
          ]);
        } else {
          console.error('Error processing file');
        }
      }
    }
  };

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom initially
  }, [messages]); // Re-scroll whenever messages change


  const handleFileUpload = async (e) => {
    setFile(e.target.files[0]);
    setFileOutput(''); // Reset the fileOutput state
  };
  
  

  return (
    <div className="chatbot-container">
      <div className="chat-interface" ref={chatRef}>
        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble ${message.type}`}>
            {message.message}
          </div>
        ))}
      </div>
      <div className="input-bar">
        <input
          type="file"
          accept=".txt,.pdf" // Specify allowed file types
          onChange={handleFileUpload}
        />
        <input
          type="text"
          value={userInput}
          onChange={handleUserInput}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
