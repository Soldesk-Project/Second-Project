package org.joonzis.mapper;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.QuestRequestVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;

@Mapper
public interface AdminMapper {

    //문제 등록 메소드
	public void insertQuestion(QuestionDTO questionDTO);
    
    //문제 검색 메소드
	public List<QuestionDTO> getQuestionsBySearch(Map<String, Object> params);
    public int getTotalQuestionCount(Map<String, Object> params);
    
    //문제 수정 메소드
    public void updateQuestion(QuestionDTO questionDTO);
    
    //문제 삭제 메소드
    public int deleteQuestions(Map<String, Object> params);
    
    //유저 검색 메소드
    public List<UsersVO> selectAllUsers();
	public List<UsersVO> searchUsers(@Param("searchType")String searchType, @Param("searchValue")String searchValue, @Param("offset")int offset, @Param("size")int size);
	
	//유저 채금 확인/적용/해제메소드
	public List<UsersVO> getUsersChatBanStatus(@Param("userNos") List<Integer> userNos);
	public int updateChatBanStatus(@Param("userNos") List<Integer> userNos, @Param("bannedTimestamp") Timestamp bannedTimestamp);
	public int unbanChatUsers();
	
	//업적 등록 메소드
	public void insertAchievement(AchievementDTO achievementDTO);
	
	//업적 검색 메소드
	public List<AchievementDTO> searchAchievements(Map<String, Object> params);
	public int getTotalAchievementCount(Map<String, Object> params);
	
	//업적 삭제 메소드
	public int deleteAchievementByTitle(Map<String, Object> params);
	
	// 업적 수정
	public int updateAchievement(AchievementDTO dto);
	
	//아이템 등록 메소드
	public void insertItem(ItemVO itemVO);
	
	//아이템 검색 메소드
	public int getTotalItemCount(Map<String, Object> params);
	public List<ItemVO> searchItems(Map<String, Object> params);
	
	//아이템 수정 메소드
	public int updateItem(ItemVO itemVO);
	
	//아이템 삭제 메소드
	public void deleteItems(Map<String, Object> params);

	public List<QuestRequestVO> selectQuestRequests(Map<String, Object> params);

	public int getQuestRequestTotalCount(Map<String, Object> params);

	public QuestRequestVO selectQuestRequestById(long id);

	public void updateQuestRequest(QuestRequestVO questRequestVO);
	// 실제 문제 등록
	public void insertQuestion2(QuestRequestVO vo);

	// 공지사항 등록
	public void registerNotice(@Param("subject") String subject, @Param("message") String message);
	// 공지사항 수정
	public void editNotice(@Param("id") long id, @Param("subject") String subject, @Param("message") String message);
	// 공지사항 삭제
	public void deleteNotice(@Param("id") long id);
	// faq 등록
	public void registerFaq(@Param("question") String question, @Param("answer") String answer, @Param("category") String category);
	// faq 수정
	public void editFaq(@Param("id") long id, @Param("question") String question, @Param("answer") String answer, @Param("category") String category);
	// faq 삭제
	public void deleteFaq(@Param("id") long id);

}