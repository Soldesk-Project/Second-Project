import React, { useState } from 'react';

const Shop = () => {

    const borderStyleList = [
        '1px solid white',
        '2px dashed gold',
        '3px dotted skyblue',
        '4px double green',
        '2px solid red'
    ];

    const balloonStyleList = [
        {
        backgroundColor: '#f0f0f0',
        border: '2px solid #333',
        borderRadius: '10px',
        padding: '10px',
        position: 'relative',
        width: '200px',
        margin: '0 auto',
        marginBottom: '15px'
        },
        {
        backgroundColor: '#d0f0ff',
        border: '2px dashed #007acc',
        borderRadius: '10px',
        padding: '10px',
        position: 'relative',
        width: '200px',
        margin: '0 auto',
        marginBottom: '15px'
        },
        {
        backgroundColor: '#ffe0e0',
        border: '2px solid #cc0000',
        borderRadius: '10px',
        padding: '10px',
        position: 'relative',
        width: '200px',
        margin: '0 auto',
        marginBottom: '15px'
        }
    ];

    const titleList = ['[전설]', '[마스터]', '[초보]', '[고수]', '[개발자]'];
    const backgroundList = ['#ffffff', '#f0f8ff', '#fffacd', '#e6ffe6', '#ffe6f0'];
    
    const [backgroundIndex, setBackgroundIndex] = useState(0);
    const [titleIndex, setTitleIndex] = useState(0);
    const [balloonIndex, setBalloonIndex] = useState(0);
    const [borderIndex, setBorderIndex] = useState(0);

    const handleBorderChange = () => {
        setBorderIndex((prevIndex) => (prevIndex + 1) % borderStyleList.length);
    };

    const handleBalloonStyleChange = () => {
        setBalloonIndex((prev) => (prev + 1) % balloonStyleList.length);
    };

    const handleTitleChange = () => {
        setTitleIndex((prevIndex) => (prevIndex + 1) % titleList.length);
    };
    const handleBackgroundChange = () => {
        setBackgroundIndex((prevIndex) => (prevIndex + 1) % backgroundList.length);
    };
    return (
        <div>
            <div style={{width:'300px', height:'150px', textAlign: 'center', padding: '30px', color: 'black'}}>
                <div style={balloonStyleList[balloonIndex]} >
                    말풍선
                    <div
                        style={{
                        content: "''",
                        position: 'absolute',
                        bottom: '-15px',
                        left: '20px',
                        width: '0',
                        height: '0',
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderTop: '15px solid ' + balloonStyleList[balloonIndex].backgroundColor,
                        }}
                    />
                </div>
                <div style={{
                        border: borderStyleList[borderIndex],
                        backgroundColor: backgroundList[backgroundIndex]
                    }}>
                    {titleList[titleIndex]} nickName
                </div>
            </div>
            <div>
                <button onClick={handleBorderChange} >테두리 변경</button>
                <button onClick={handleTitleChange} >칭호 변경</button>
                <button onClick={handleBackgroundChange} >배경 변경</button>
                <button onClick={handleBalloonStyleChange} >말풍선 변경</button>
            </div>
        </div>
    );
};

export default Shop;