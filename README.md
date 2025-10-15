# 🎮 CotePlay
> Spring Legacy 기반 실시간 멀티플레이 퀴즈 게임

---

## 🧩 프로젝트 소개
**CotePlay**는 여러 사용자가 동시에 접속해 퀴즈를 풀고 경쟁하는  
**Spring MVC 기반 실시간 멀티플레이 게임**입니다. 

게임을 통해 푼 문제는 오탑노트를 통해 다시 풀어 볼 수 있습니다  
또한 게임 플레이를 통해 획득한 포인트를 소모하여서 Groq API를 통한 AI 해설을 볼 수 있으며,  
다양한 프로필 꾸미기 아이템 구매가 가능합니다.

---

## 🚀 주요 기능
- ✅ Spring WebSocket 기반 **실시간 게임 통신**
- ✅ 유저 프로필 및 참가자 목록 **실시간 브로드캐스트**
- ✅ **AI 해설 기능** (Groq API 연동)
- ✅ **게임 진행 타이머 및 점수 계산**
- ✅ **다양한 꾸미기 아이템 구매**
- ✅ **포인트 충전 기능** (TossPaymentsSDK 활용)

---

## ⚙️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | Spring MVC (Legacy), Java 11, WebSocket, MyBatis, Redis |
| **Frontend** | React, WebSocket 클라이언트 |
| **AI** | Groq API |
| **Database** | Oracle 11g |
| **Server** | Apache Tomcat 9 |
| **Authentication** | JWT(JSON Web Token) |
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
