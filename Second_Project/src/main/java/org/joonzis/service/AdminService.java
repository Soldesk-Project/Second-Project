package org.joonzis.service;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.QuestRequestVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface AdminService {
    
	//문제 관련 메소드
	//문제 등록 메소드
	public void registerQuestion(QuestionDTO questionDTO);
	//문제 검색 메소드
	public Map<String, Object> searchQuestions(String subjectCode, String query, int page, int limit);
    //문제 수정 메소드
	public void updateQuestion(QuestionDTO questionDTO);
	//문제 삭제 메소드
	public void deleteQuestions(List<Integer> questionIds, String subjectCode);

	//문제 등록 요청 관련 메소드
	//문제 등록 요청 조회 메소드
	public Map<String, Object> getQuestRequests(int page, int limit, String searchTerm, String filterStatus);
	//문제 등록 요청 검색 메소드
	public QuestRequestVO getQuestRequestById(long id);
	//문제 등록 요청 수정 메소드
	public void updateQuestRequest(QuestRequestVO questRequestVO);
	// 실제 문제 등록
	public void insertQuestion2(QuestRequestVO vo);
	
	//유저 관련 메소드
	//유저 조회 메소드
	public List<UsersVO> getAllUsers();
	//유저 검색 메소드
	public List<UsersVO> searchUsers(String searchType, String searchValue, int offset, int size);
	//유저 채금 적용 메소드
	public int banChatusers(List<Integer> userNos);
    //유저 채금 해제 메소드
	public void unbanChatUsers();
	
	//업적 관련 메소드
	//업적 등록 메소드
	public void registerAchievement(AchievementDTO achievementDTO);
	//업적 검색 메소드
	public Map<String, Object> searchAchievement(String type, String query, int page, int limit);
	//업적 삭제 메소드
	public boolean deleteAchievementByTitle(String type, String ach_title);
	
	// 업적 수정
	public boolean updateAchievement(AchievementDTO dto);
	
	//아이템 관련 메소드
	//아이템 등록 메소드
	public void registerItem(ItemVO itemVO) throws Exception;

	//아이템 검색 메소드
	public Map<String, Object> searchItems(String decodedType, String decodedQuery, int page, int limit);
	//아이템 수정 메소드
	public void updateItem(int itemNo, String type, String itemName, int itemPrice, MultipartFile itemImage, String originalImageFileName);
	//아이템 삭제 메소드

	public void deleteItems(String itemType, int itemNo);

	// 공지사항 작성
	public void registerNotice(String subject, String message);
	// 공지사항 수정
	public void editNotice(long id, String subject, String message);
	// 공지사항 삭제
	public void deleteNotice(long id);
	// faq 작성
	public void registerFaq(String question, String answer, String category);
	// faq 수정
	public void editFaq(long id, String question, String answer, String category);
	// faq 삭제
	public void deleteFaq(long id);
	
	
}