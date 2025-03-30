import React, { useState, useEffect, useRef } from "react";
import "./ChatWindow.css";
import { getAIMessage, resetHistory } from "../api/api";
import { marked } from "marked";
import loadingGif from "../assets/loading.gif"

function ChatWindow() {

  const defaultMessage = [{
    role: "assistant",
    content: "Hi, how can I help you today?"
  }];

  const [messages,setMessages] = useState(defaultMessage)
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const handleSend = async (input) => {
    if (typeof input === "string" && input.trim() !== "") {
      // Set user message
      setMessages(prevMessages => [...prevMessages, { role: "user", content: input }]);
      setInput("");
      setLoading(true);

      // Call API & set assistant message
      const newMessage = await getAIMessage(input);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetHistory();
    setMessages(defaultMessage);
  }

  return (
      <div className="messages-container">
          {messages.map((message, index) => (
              <div key={index} className={`${message.role}-message-container`}>
                  {message.content && (
                      <div className={`message ${message.role}-message`}>
                          <div dangerouslySetInnerHTML={{__html: marked(message.content).replace(/<p>|<\/p>/g, "")}}></div>
                      </div>
                  )}
              </div>
          ))}

          {loading && (
            <div className="loading-message">
              <img src={loadingGif} alt="Loading..." className="loading-gif" style={{ width: "40px", height: "40px" }} />
            </div>
          )}

          <div ref={messagesEndRef} />
          <div className="input-area">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about PartSelect..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSend(input);
                  e.preventDefault();
                }
              }}
              rows="3"
            />
            <button className="send-button" onClick={handleSend}>
              Send
            </button>
            <button className="reset-button" onClick={handleReset}> Clear </button>
          </div>
      </div>
);
}

export default ChatWindow;
