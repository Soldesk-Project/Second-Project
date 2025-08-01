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
	void registerQuestion(QuestionDTO questionDTO);
    //문제 검색 메소드
	Map<String, Object> searchQuestions(String subjectCode, String query, int page, int limit);
    //문제 수정 메소드
	void updateQuestion(QuestionDTO questionDTO);
	//문제 삭제 메소드
	void deleteQuestions(List<Integer> questionIds, String subjectCode);

	//문제 등록 요청 관련 메소드
	//문제 등록 요청 조회 메소드
	Map<String, Object> getQuestRequests(int page, int limit, String searchTerm, String filterStatus);
	//문제 등록 요청 검색 메소드
	QuestRequestVO getQuestRequestById(long id);
	//문제 등록 요청 수정 메소드
	void updateQuestRequest(QuestRequestVO questRequestVO);
	
	//유저 관련 메소드
	//유저 조회 메소드
	List<UsersVO> getAllUsers();
	//유저 검색 메소드
	List<UsersVO> searchUsers(String searchType, String searchValue);
	//유저 채금 적용 메소드
	int banChatusers(List<Integer> userNos);
    //유저 채금 해제 메소드
	void unbanChatUsers();
	
	//업적 관련 메소드
	//업적 등록 메소드
	void registerAchievement(AchievementDTO achievementDTO);
	//업적 검색 메소드
	Map<String, Object> searchAchievement(String type, String query, int page, int limit);
	//업적 삭제 메소드
	boolean deleteAchievementsByTitles(String type, List<String> achievementTitles);
	
	//아이템 관련 메소드
	//아이템 등록 메소드
	void registerItem(ItemVO itemVO, MultipartFile itemImage) throws Exception;
	//아이템 검색 메소드
	Map<String, Object> searchItems(String decodedType, String decodedQuery, int page, int limit);
	//아이템 수정 메소드
	void updateItem(int itemNo, String type, String itemName, int itemPrice, MultipartFile itemImage, String originalImageFileName);
	//아이템 삭제 메소드
	void deleteItems(String itemType, List<Integer> itemNos);
	
	
	
	
}