import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: `${process.env.NEXT_PUBLIC_VEHICLE}`  }
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: "Sorry, an error occurred. Please try again." }]);

    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (userInput.trim() === "") {
    return;
  }

  setLoading(true);
  const userMessage = { role: "user", content: userInput };
  const placeholderAssistantMessage = { role: "assistant", content: "..." };

  setMessages((prevMessages) => [
    ...prevMessages,
    userMessage,
    placeholderAssistantMessage
  ]);

  try {  
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (!response.ok) {
      handleError();
      return;
    }

    const stream = response.body;
    if (!stream) {
      console.error("No response body received from API.");
      return;
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let currentAssistantResponse = ""; // Initialize the response here
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
  
      if (value) {
        const chunkValue = decoder.decode(value);
        currentAssistantResponse += chunkValue;

        // Update the assistant's message with the latest chunk
        setMessages((prevMessages) => {
          // Get all messages except the last placeholder assistant message
          const withoutLastAssistant = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...withoutLastAssistant,
            { role: "assistant", content: currentAssistantResponse }
          ];
        });

        console.log("Received chunk:", chunkValue); // Log each chunk received
      }
    }
    setUserInput("");
    setLoading(false);
  } catch (error) {
    console.error("Error during API fetch:", error); // Log any errors during fetch
    handleError();
  }
};

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <>
      <Head>
        <title>GPT-4 Chat UI</title>
        <meta name="description" content="GPT-4 interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.role === "assistant" ? styles.apimessage : styles.usermessage}>
                {/* Display the correct icon depending on the message type */}
                {message.role === "assistant" ? 
                  <Image src={process.env.NEXT_PUBLIC_IMAGE_SRC} alt="AI" width="30" height="30" className={styles.boticon} priority={true} /> 
                  : <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority={true} />}
                <div className={styles.markdownanswer}>
                  <ReactMarkdown linkTarget={"_blank"}>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                type="text"
                id="userInput"
                name="userInput"
                placeholder={loading ? "Waiting for response..." : "Type your question..."}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
