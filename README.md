# 🎮 CotePlay
> Spring Legacy 기반 실시간 멀티플레이 퀴즈 게임

---

## 🧩 프로젝트 소개
**CotePlay**는 여러 사용자가 동시에 접속해 퀴즈를 풀고 경쟁하는  
**Spring MVC 기반 실시간 멀티플레이 게임**입니다.  

사용자가 문제를 풀면 AI가 오답을 분석하여 해설을 제공하고,  
이미지를 업로드하면 **OCR 인식으로 문제 텍스트를 자동 추출**합니다.  

> Spring Boot가 아닌 **Spring Legacy (MVC) 구조**를 사용하며,  

---

## 🚀 주요 기능
- ✅ Spring WebSocket 기반 **실시간 게임 통신**
- ✅ 유저 프로필 및 참가자 목록 **실시간 브로드캐스트**
- ✅ **AI 해설 기능** (Groq API 연동)
- ✅ **게임 진행 타이머 및 점수 계산**

---

## ⚙️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | Spring MVC (Legacy), Java 11, WebSocket, MyBatis |
| **Frontend** | React, WebSocket 클라이언트 |
| **AI** | Groq API |
| **Database** | Oracle 11g |
| **Server** | Apache Tomcat 9 |
| **Build Tool** | Maven |
| **Environment** | Localhost (로컬 실행) |

---

## 🧠 시스템 구조

```plaintext
 ┌────────────────────────────┐
 │        React Frontend      │
 │ (Lobby, InPlay, Result UI) │
 └──────────────┬─────────────┘
                │
                │ WebSocket / REST API
                ▼
 ┌────────────────────────────┐
 │   Spring Legacy Backend    │
 │  - DispatcherServlet       │
 │  - WebSocketConfig         │
 │  - RoomUserList Broadcast  │
 │  - AI Integration          │
 └──────────────┬─────────────┘
                │
                ▼
 ┌────────────────────────────┐
 │         Oracle DB          │
 └────────────────────────────┘
