import React, { useEffect } from 'react'
import { MdAttachFile, MdSend } from 'react-icons/md'
import { useState, useRef } from 'react'
import avatar from '../components/avatar.png'
import { useNavigate } from 'react-router-dom'
import  useChatContext  from '../context/ChatContext'
import SockJS from 'sockjs-client';
import { baseURL } from '../config/AxiosHelper'
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import { getMessages } from '../config/AxiosHelper';
import { timeAgo } from '../config/helper'

const Chat = () => {
    
    const {roomId ,currentUser, connected, setRoomId, setCurrentUser, setConnected} = useChatContext();
    // console.log(roomId ,currentUser, connected);

    const navigate = useNavigate();

    useEffect( () => {
        if(!connected){
            navigate('/');
        }
    }, [connected, roomId, currentUser]);
    
    const [messages, setMessages] = useState([
        
    ]);
    
    const [input , setInput] = useState('');
    const inputRef = useRef(null);
    const chatBoxRef = useRef(null);
    const stompClientRef = useRef(null);

    useEffect( () => {
        async function loadMessages(){
            try{
                const messages = await getMessages(roomId);
                // console.log(messages);
                setMessages(messages);
            }
            catch(e){

            }
    }
        if(connected){
        loadMessages();
        }
    }, [roomId]);


    useEffect(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scroll({
          top: chatBoxRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }
    })

    useEffect(() => {
        const client = new Client({
        webSocketFactory: () => new SockJS(`${baseURL}/chat`),
        reconnectDelay: 5000,
    });

    client.onConnect = () => {
        console.log("Connected");
        toast.success("Connected");

        stompClientRef.current = client;

    client.subscribe(`/topic/room/${roomId}`, (message) => {
      console.log("Received message:", message.body);  
      const newMessage = JSON.parse(message.body);
      setMessages((prev) => [...prev, newMessage]);
    });
  };

    client.onStompError = (frame) => {
        console.error("Broker error:", frame);
        toast.error("Connection error");
  };

    client.activate();

    return () => {
        client.deactivate(); 
  };
    }, [roomId]);


    const sendMessage = async () => {
        if(stompClientRef.current && connected && input.trim()){
            console.log(input);

            const message = {
                sender: currentUser,
                content: input,
                roomId: roomId
            }

            stompClientRef.current.publish({
                destination: `/app/sendMessage/${roomId}`,
                body: JSON.stringify(message),
            })
            setInput('');
        }
    }


    function handleLogout(){
      if(stompClientRef.current){
        stompClientRef.current.deactivate();
      }
      setConnected(false);
      setRoomId('');
      setCurrentUser('');
      navigate('/');
    }

  return (
    <div className=''>
        <header className='dark:border-gray-700 border w-full py-5 shadow flex justify-around items-center dark:bg-gray-900'>
            <div>
                <h1 className='text-xl font-semibold'>Room :<span>{roomId}</span></h1>
            </div>
            <div>
                <h1 className='text-xl font-semibold'>Username :<span>{currentUser}</span></h1>
            </div>
            <div>
                <button onClick={handleLogout} className='dark:bg-red-500 hover:dark:bg-red-600 px-3 py-2 rounded-full cursor-pointer'>Leave Room</button>
            </div>
        </header>

        <main
        ref={chatBoxRef}
        className="py-20 px-10   w-2/3 dark:bg-slate-600 mx-auto h-screen overflow-auto "
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === currentUser ? "justify-end" : "justify-start"
            } `}
          >
            <div
              className={`my-2 ${
                message.sender === currentUser ? "bg-green-800" : "bg-gray-800"
              } p-2 max-w-xs rounded`}
            >
              <div className="flex flex-row gap-2">
                <img
                  className="h-10 w-10"
                  src={avatar}
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">{message.sender}</p>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-500">{timeAgo(message.timeStamp)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

        <div className='fixed bottom-2 w-full h-16'>
            <div className='h-full pr-10 gap-4  flex items-center justify-between rounded-full w-1/2 mx-auto dark:bg-gray-900'>
                <input
                value={input}
                onChange={(e) => {setInput(e.target.value)}}
                onKeyDown={(e) => {
                  if(e.key === "Enter"){
                    sendMessage();
                  }
                }}
                type='text' placeholder='Type your message here...'
                className='w-full dark:bg-gray-600 px-5 py-2 border dark:border-gray-600 rounded-full h-full focus:outline-none'></input>
                <div className='flex gap-2'>
                    <button 
                    className='dark:bg-purple-600  rounded-full cursor-pointer flex justify-center items-center h-10 w-10'>
                    <MdAttachFile size={20} /></button>
                    <button 
                    onClick={sendMessage}
                    className='dark:bg-green-600  rounded-full cursor-pointer flex justify-center items-center h-10 w-10'>
                    <MdSend size={20} /></button>
                    
                </div>
            </div>
        </div>
    </div>
  )
}

export default Chat