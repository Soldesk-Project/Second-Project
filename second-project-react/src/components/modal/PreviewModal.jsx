// components/PreviewModal.jsx
import React, { useEffect } from 'react';
import decoStyles from '../../css/Decorations.module.css';
import titleTextMap from '../../js/Decorations';

const PreviewModal = ({ action, user, item, onClose, on_click }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!item) return null;

  const previewStyle = {
    ...user
  };
  
  switch (item.item_type) {
    case 'boundary':
      previewStyle.boundary_class_name = item.css_class_name;
      break;
    case 'title':
      previewStyle.title_class_name = item.css_class_name;
      break;
    case 'fontColor':
      previewStyle.fontcolor_class_name = item.css_class_name;
      break;
    case 'background':
      previewStyle.background_class_name = item.css_class_name;
      break;
    case 'balloon':
      previewStyle.balloon_class_name = item.css_class_name;
      break;
    default:
      break;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '10px',
          minWidth: '300px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 style={{color: 'black'}}>미리보기</h4>
        <div
          className={[
            decoStyles[previewStyle.background_class_name],
            decoStyles[previewStyle.boundary_class_name],
            decoStyles[previewStyle.balloon_class_name]
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ padding: '20px', display: 'inline-block' }}
        >
          <span className={decoStyles[previewStyle.fontcolor_class_name]}>
            {titleTextMap[previewStyle.title_class_name] && (
                <span className={decoStyles[previewStyle.title_class_name]} style={{ marginRight: '5px' }}>
                [{titleTextMap[previewStyle.title_class_name]}]
                </span>)}
            {user.user_nick}
          </span>   
        </div>
        <div style={{ marginTop: '20px', color:'black' }}>
            {
              action === 'Shop' ? <button onClick={on_click} style={{marginRight:"10px"}}>구매</button> : <button onClick={on_click} style={{marginRight:"10px"}}>장착</button>
            }
            <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
