import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaSave } from "react-icons/fa";
import { MdCancel } from "react-icons/md"; // Cancel icon
import "./MyPage.css";

const MyPage = ({ userId }) => {
  const [items, setItems] = useState([]); // User's list of items
  const [newItem, setNewItem] = useState({ type: "text", content: "" }); // New item input
  const [editingIndex, setEditingIndex] = useState(null); // Index of item being edited
  const [editingItem, setEditingItem] = useState(null); // Edited item content
  const baseUrl = "https://172.10.7.34:5001";

  useEffect(() => {
    const fetchItems = async () => {
      const response = await fetch(`${baseUrl}/users/${userId}/items`);
      const data = await response.json();
      setItems(data);
    };

    fetchItems();
  }, []);

  // Add a new item
  const handleAddItem = async () => {
    if (newItem.content.trim()) {
      try {
        const response = await fetch(`${baseUrl}/users/${userId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        const updatedItems = await response.json();
        setItems(updatedItems);
        setNewItem({ type: 'text', content: '' });
      } catch (error) {
        alert('Failed to add item');
      }
    } else {
      alert('내용을 입력하세요!');
    }
  };

  // Delete an item
  const handleDeleteItem = async (index) => {
    const isConfirmed = window.confirm('이 아이템을 삭제하시겠습니까?');
    if (isConfirmed) {
      try {
        const response = await fetch(`${baseUrl}/users/${userId}/items/${index}`, {
          method: 'DELETE',
        });
        const updatedItems = await response.json();
        setItems(updatedItems);
      } catch (error) {
        alert('Failed to delete item');
      }
    }
  };

  // Start editing an item
  const handleEditItem = (index) => {
    setEditingIndex(index);
    setEditingItem(items[index]);
  };

  // Save the edited item
  const handleSaveEdit = async () => {
    if (editingItem.content.trim()) {
      try {
        const response = await fetch(`${baseUrl}/users/${userId}/items/${editingIndex}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingItem),
        });
        const updatedItems = await response.json();
        setItems(updatedItems);
        setEditingIndex(null);
        setEditingItem(null);
      } catch (error) {
        alert('Failed to save changes');
      }
    } else {
      alert('내용을 입력하세요!');
    }
  };

  const renderItemContent = (item) => {
    switch (item.type) {
      case "image":
        return <img src={item.content} alt="Item" className="item-image" />;
      case "video":
        // Convert YouTube URL to embed URL
        const videoId = item.content.split("v=")[1]?.split("&")[0]; // Extract video ID
        const startTime = item.content.split("t=")[1];
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?start=${startTime}` : null;

        if (!embedUrl) {
          return <p>유효하지 않은 YouTube 링크입니다.</p>; // Show error for invalid links
        }

        return (
          <iframe
            width="560"
            height="315"
            src={embedUrl}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      default:
        return <p>{item.content}</p>;
    }
  };

  return (
    <div className="my-page">
      <h2>내 아이템 목록</h2>
      <div className="item-list">
        {items.length === 0 ? (
          <p>아직 아이템이 없습니다. 추가해보세요!</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="item">
              {editingIndex === index ? (
                <div className="edit-item">
                  <select
                    value={editingItem.type}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, type: e.target.value })
                    }
                  >
                    <option value="text">텍스트</option>
                    <option value="image">이미지</option>
                    <option value="video">비디오</option>
                  </select>
                  <input
                    type="text"
                    value={editingItem.content}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, content: e.target.value })
                    }
                  />
                  <div className="button-couple">
                    <button onClick={handleSaveEdit} title="저장"><FaSave /></button>
                    <button onClick={() => setEditingIndex(null)} title="취소"><MdCancel /></button>
                  </div>
                </div>
              ) : (
                <>
                  {renderItemContent(item)}
                  <div className="button-couple">
                    <button onClick={() => handleEditItem(index)} title="수정"><FaEdit /></button>
                    <button onClick={() => handleDeleteItem(index)} title="삭제"><FaTrash /></button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      <form
        className="add-item"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddItem();
        }}
      >
        <select
          value={newItem.type}
          onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
        >
          <option value="text">텍스트</option>
          <option value="image">이미지</option>
          <option value="video">비디오</option>
        </select>
        <input
          type="text"
          placeholder={
            newItem.type === "text"
              ? "새 아이템을 입력하세요"
              : newItem.type === "image"
              ? "이미지 URL을 입력하세요"
              : "유튜브 링크를 입력하세요"
          }
          value={newItem.content}
          onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
        />
      </form>
    </div>
  );
};

export default MyPage;
