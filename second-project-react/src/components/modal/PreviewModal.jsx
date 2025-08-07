import React, { useEffect } from 'react';
import styles from '../../css/PreviewModal.module.css';
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

  const previewStyle = { ...user };
  

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
    case 'unique':
      if (item.css_class_name?.includes('fontColor')) {
        previewStyle.fontcolor_class_name = item.css_class_name; // 무지개 글자 같은 색상
      } else if (item.css_class_name?.includes('title')) {
        previewStyle.title_class_name = item.css_class_name; // 콜렉터 같은 칭호
      } else if(item.imgUrl?.includes('/images/syberBackground.png')){
        console.log(1);
      }
      break;
    default:
      break;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* boundary 타입 */}
        {(item.item_type === 'boundary' || item.item_no === 118) && (
          <div className={`${styles.previewImg} ${styles.boundary}`}>
            <img src={profileSrc} alt="Profile" className={styles.profileImg} />
            <img 
              src={`/images/${item.imageFileName}`} 
              alt="Profile Border" 
              className={styles.boundaryImg}
            />
          </div>
        )}

        {/* background 타입 */}
        {item.item_type === 'background' && (
          <div className={styles.previewImg}>
            <img 
              src={`/images/${item.imageFileName}`} 
              alt="Background" 
              className={styles.background} 
            />
          </div>
        )}

        {/* balloon 타입 */}
        {item.item_type === 'balloon' && (
          <div className={styles.previewImg}>
            <img 
              src={`/images/${item.imageFileName}`} 
              alt="Balloon" 
              className={styles.balloon} 
            />
          </div>
        )}

        {/* 유니크 명함 타입 */}
        {item.item_type === 'unique' && item.item_no === 119 && (
          <div className={styles.previewImg}>
            <img 
              src={`/images/${item.imageFileName}`} 
              alt="Balloon" 
              className={styles.background} 
            />
          </div>
        )}

        {/* 텍스트 미리보기 */}
        {(item.item_type === 'fontColor' || item.item_type === 'title' || (item.item_type === 'unique' && item.item_no !== 119 && item.item_no !== 118)) && (
          <div className={styles.textPreview}>
            {(() => {
              const layers = [
                previewStyle.background_class_name,
                previewStyle.boundary_class_name,
                previewStyle.balloon_class_name,
              ].filter(Boolean);

              const textElement = (
                <span className={decoStyles[previewStyle.fontcolor_class_name]}>
                  {/* title 출력 */}
                  {titleTextMap[previewStyle.title_class_name] && (
                    <span className={decoStyles[previewStyle.title_class_name]} style={{ marginRight: '5px' }}>
                      [{titleTextMap[previewStyle.title_class_name]}]
                    </span>
                  )}
                  {/* 닉네임 출력 */}
                  {user.user_nick}
                </span>
              );

              return layers.reduceRight(
                (child, className) => (
                  <div className={decoStyles[className]}>{child}</div>
                ),
                textElement
              );
            })()}
          </div>
        )}


        {/* 버튼 영역 */}
        <div className={styles.buttons}>
          <button className={`${styles.button} ${styles.closeButton}`} onClick={onClose}>닫기</button>
          {action === 'Shop' ? (
            <button onClick={on_click} className={`${styles.button} ${styles.buyButton}`}>구매</button>
          ) : (
            <button onClick={on_click} className={`${styles.button} ${styles.equipButton}`}>장착</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
