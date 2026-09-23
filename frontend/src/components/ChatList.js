import React from "react";
import ChatItem from "./ChatItem";

function ChatList({ chats }) {

  if (!chats || chats.length === 0) {
    return (
      <p>No tenés chats todavía.</p>
    );
  }

  return (
    <div className="chat-list">

      {chats.map((chat) => (
        <ChatItem
          key={chat.id_chat}
          chat={chat}
        />
      ))}

    </div>
  );
}

export default ChatList;
