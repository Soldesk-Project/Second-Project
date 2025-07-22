// components/PreviewModal.jsx
import React, { useEffect } from 'react';
import decoStyles from '../../css/Decorations.module.css';
import titleTextMap from '../../js/Decorations';

const PreviewModal = ({ 
  action, 
  user, 
  item, 
  profileSrc,
  inventoryItems, 
  onClose, 
  on_click
}) => {

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
        
        {/* ① 프로필 이미지 */}
        <div className='previewImg'
         style={{
           position: 'relative',
           width: 180,
           height: 180,
           margin: '0 auto 20px',
           overflow: 'visible',
         }}
       >
         {/* 실제 프로필 */}
         <img
           src={profileSrc}
           alt="Profile"
           style={{
             width: '100%',
             height: '100%',
             borderRadius: '50%',
             objectFit: 'cover',
           }}
         />
         {/* 선택된 테두리 이미지 (previewStyle.boundary_class_name 에 맞춘 파일명) */}
         <img
           src={`/images/${item.imageFileName}`}
           alt="Profile Border"
           style={{
              position: 'absolute',
              bottom: 0,                // 컨테이너 바닥에 링을 붙이고
              left: '50%',              // 가로 중앙 정렬
              transform: 'translateX(-50%)', // 중앙에서 반만 이동
              width: '101%',            // intrinsic width
              height: 'auto',           // intrinsic height
              objectFit: 'contain',
              pointerEvents: 'none',
           }}
         />
       </div>
        
        {/* ② 텍스트 데코 미리보기 */}
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
