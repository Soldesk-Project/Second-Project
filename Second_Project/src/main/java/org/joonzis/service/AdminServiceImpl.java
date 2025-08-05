package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.QuestRequestVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.mapper.AdminMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.log4j.Log4j;

@Log4j
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminMapper adminMapper;
    
    @Autowired
    private FileUploadService fileUploadService;
    
    //임시 이미지 업로드 경로
    private final String uploadDir = "C:/Dev/workspace/workspace_2ndProject/second-project-react/public/images/";
    
    private void deleteImageFile(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir + fileName); // 이미지 저장 경로
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("기존 이미지 파일 삭제 성공: " + fileName); // System.out 대신 log 사용
            } else {
                log.warn("삭제할 이미지 파일이 존재하지 않습니다: " + fileName);
            }
        } catch (IOException e) {
            log.error("기존 이미지 파일 삭제 실패: " + fileName + " - " + e.getMessage(), e);
        }
    }
    
    //DB 'Question' 테이블의 'subject' 컬럼 값과 한글 표시명을 매핑
    private static final Map<String, String> SUBJECT_CODE_TO_NAME_MAP;
    
    static {
        Map<String, String> map = new HashMap<>();
        map.put("cpe", "정보처리기사");
        map.put("cpei", "정보처리산업기사");
        map.put("cpet", "정보처리기능사");
        map.put("lm1", "리눅스마스터1급");
        map.put("lm2", "리눅스마스터2급");
        map.put("icti", "정보통신산업기사");
        map.put("ict", "정보통신기사");
        map.put("sec", "정보보안기사");
        map.put("net1", "네트워크관리사1급");
        map.put("net2", "네트워크관리사2급");
        SUBJECT_CODE_TO_NAME_MAP = Collections.unmodifiableMap(map);
        
        log.info("SUBJECT_CODE_TO_NAME_MAP 초기화 완료. 키셋: " + SUBJECT_CODE_TO_NAME_MAP.keySet());
    }

    // 유효한 문제 주제인지 확인하는 헬퍼 메소드
    private boolean isValidSubjectCode(String subjectCode) {
        return SUBJECT_CODE_TO_NAME_MAP.containsKey(subjectCode);
    }
    
    // 문제 주제 이름으로 한글 주제 이름을 가져오는 헬퍼 메소드
    private String getSubjectDisplayName(String subjectCode) {
        return SUBJECT_CODE_TO_NAME_MAP.get(subjectCode);
    }
    
    // 문제 등록
    @Override
    public void registerQuestion(QuestionDTO questionDTO) {
    	 String subjectCode = questionDTO.getSubject();
    	
    	log.info("ServiceImpl: registerQuestion 호출 - 수신된 subject 코드: " + subjectCode);

        // 1. 필수 필드 검증
        if (questionDTO.getQuestion_text() == null || questionDTO.getQuestion_text().trim().isEmpty()) {
            throw new IllegalArgumentException("문제 본문은 필수 입력 값입니다.");
        }
        for (int i = 1; i <= 4; i++) {
            try {
                java.lang.reflect.Method getter = QuestionDTO.class.getMethod("getOption_" + i);
                String option = (String) getter.invoke(questionDTO);
                if (option == null || option.trim().isEmpty()) {
                    throw new IllegalArgumentException(i + "번 선택지는 필수 입력 값입니다.");
                }
            } catch (Exception e) {
                log.error("옵션 검증 중 예기치 않은 오류 발생", e);
                throw new IllegalStateException("옵션 검증 중 예기치 않은 오류 발생", e);
            }
        }
        if (questionDTO.getCorrect_answer() < 1 || questionDTO.getCorrect_answer() > 4) {
            throw new IllegalArgumentException("정답은 1에서 4 사이여야 합니다.");
        }

        // 2. subject 코드 유효성 검사
        if (subjectCode == null || !isValidSubjectCode(subjectCode)) {
            throw new IllegalArgumentException("유효하지 않은 과목(subject) 코드입니다: " + subjectCode);
        }

        // 3. Service 계층에서 Base64 디코딩 수행
        if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
            try {
                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
                questionDTO.setImage_data(decodedBytes);
                questionDTO.setImage_data_base64(null);
            } catch (IllegalArgumentException e) {
                log.error("Base64 이미지 데이터 디코딩 실패: " + e.getMessage(), e);
                throw new IllegalArgumentException("유효하지 않은 이미지 데이터 형식입니다.", e);
            }
        } else {
            questionDTO.setImage_data(null);
        }

        // 4. Mapper 호출을 위한 QuestionDTO 직접 사용
        try {
            adminMapper.insertQuestion(questionDTO); // ⭐ Map 대신 QuestionDTO를 직접 넘기도록 변경
            log.info(getSubjectDisplayName(subjectCode) + " (" + subjectCode + ") 과목에 문제 등록 성공.");
        } catch (Exception e) {
            log.error("문제 등록 중 데이터베이스 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에 문제를 등록하는 중 오류가 발생했습니다.", e);
        }
    }

    // 수정 및 삭제를 위한 문제 검색
    @Override
    public Map<String, Object> searchQuestions(String subjectCode, String query, int page, int limit) {
        List<QuestionDTO> questions = new ArrayList<>();
        int totalCount = 0;
        int totalPages = 0;

        Map<String, Object> result = new HashMap<>();
        result.put("questions", questions);
        result.put("totalPages", totalPages);
        result.put("totalCount", totalCount);
        result.put("error", null);

        log.info("ServiceImpl: searchQuestions 호출 - category(tableName): " + subjectCode + ", 검색어: " + query + ", 페이지: " + page + ", 제한: " + limit);

     // subject 코드 유효성 검사
        if (subjectCode == null || !isValidSubjectCode(subjectCode)) {
            result.put("error", "유효하지 않은 과목 코드입니다: " + subjectCode);
            log.warn("유효하지 않은 과목 코드 요청: " + subjectCode);
            return result;
        }

        try {
        	int offset = (page - 1) * limit;
            log.debug("계산된 OFFSET: " + offset);

            Map<String, Object> params = new HashMap<>();
            params.put("subjectCode", subjectCode);
            params.put("query", query);
            params.put("offset", offset);
            params.put("limit", limit);
            log.debug("매퍼 파라미터 Map 준비: " + params);

            try {
                // getTotalQuestionCount 메서드도 subjectCode를 필터링 기준으로 사용해야 함
                totalCount = adminMapper.getTotalQuestionCount(params);
                log.info("총 문제 개수 조회 성공: " + totalCount);
                totalPages = (int) Math.ceil((double) totalCount / limit);
                log.debug("계산된 총 페이지 수: " + totalPages);
            } catch (Exception e) {
                log.error("Mapper.getTotalQuestionCount 호출 중 오류 발생: " + e.getMessage(), e);
                totalCount = 0;
                totalPages = 0;
                result.put("error", "총 문제 개수 조회 중 오류 발생: " + e.getMessage());
            }

            if (result.get("error") == null) {
                try {
                    questions = adminMapper.getQuestionsBySearch(params);
                    log.info("Mapper.getQuestionsBySearch 호출 성공. 조회된 문제 수: " + (questions != null ? questions.size() : 0));

                    if (questions != null) {
                        for (QuestionDTO question : questions) {
                            if (question.getImage_data() != null && question.getImage_data().length > 0) {
                                try {
                                    String base64Image = Base64.getEncoder().encodeToString(question.getImage_data());
                                    question.setImage_data_base64(base64Image);
                                    question.setImage_data(null);
                                    log.debug("문제 ID " + question.getId() + " 이미지 Base64 변환 성공.");
                                } catch (Exception e) {
                                    log.error("문제 ID " + question.getId() + " 이미지 Base64 변환 중 오류 발생: " + e.getMessage(), e);
                                    question.setImage_data_base64("");
                                    question.setImage_data(null);
                                }
                            } else {
                                question.setImage_data_base64("");
                                question.setImage_data(null);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Mapper.getQuestionsBySearch 호출 중 오류 발생: " + e.getMessage(), e);
                    questions = new ArrayList<>();
                    result.put("error", "문제 목록 조회 중 오류 발생: " + e.getMessage());
                }
            }

            result.put("questions", questions);
            result.put("totalPages", totalPages);
            result.put("totalCount", totalCount);

        } catch (Exception e) {
            log.error("ServiceImpl.searchQuestions 메서드 실행 중 알 수 없는 예외 발생: " + e.getMessage(), e);
            result.put("error", "서버 내부 오류가 발생했습니다: " + e.getMessage());
        }

        log.info("ServiceImpl: searchQuestions 결과 반환. questions size: " + ((List)result.get("questions")).size() + ", totalCount: " + result.get("totalCount") + ", error: " + result.get("error"));
        return result;
    }

    // 문제 수정 메서드
    @Override
    public void updateQuestion(QuestionDTO questionDTO) {
    	String subjectCode = questionDTO.getSubject();
    	log.info("ServiceImpl: 문제 수정 실행 - subjectCode: " + subjectCode + ", DTO: " + questionDTO);

    	// subject 코드 유효성 검사
        if (subjectCode == null || !isValidSubjectCode(subjectCode)) {
            throw new IllegalArgumentException("유효하지 않은 과목 코드입니다: " + subjectCode);
        }

     // Service 계층에서 Base64 디코딩 수행
        if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
            try {
                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
                questionDTO.setImage_data(decodedBytes);
                questionDTO.setImage_data_base64(null);
            } catch (IllegalArgumentException e) {
                log.error("Base64 이미지 데이터 디코딩 실패: " + e.getMessage(), e);
                throw new IllegalArgumentException("유효하지 않은 이미지 데이터 형식입니다.", e);
            }
        } else {
            questionDTO.setImage_data(null);
        }

        try {
            adminMapper.updateQuestion(questionDTO); // ⭐ QuestionDTO 자체를 넘기도록 변경
            log.info(getSubjectDisplayName(subjectCode) + " 과목의 문제 ID " + questionDTO.getId() + " 수정 성공.");
        } catch (Exception e) {
            log.error("문제 수정 중 매퍼 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에서 문제를 수정하는 중 오류가 발생했습니다.", e);
        }
    }
    
    // 문제 삭제 메소드
    @Override
    public void deleteQuestions(List<Integer> questionIds, String subjectCode) {
        log.info("ServiceImpl: deleteQuestions 호출 subjectCode: " + subjectCode + ", 삭제할 ID 목록: " + questionIds);

        if (questionIds == null || questionIds.isEmpty()) {
            throw new IllegalArgumentException("삭제할 문제 ID가 제공되지 않았습니다.");
        }

     // subject 코드 유효성 검사
        if (subjectCode == null || !isValidSubjectCode(subjectCode)) {
            throw new IllegalArgumentException("유효하지 않은 과목 코드입니다: " + subjectCode);
        }
        
        Map<String, Object> params = new HashMap<>();
        params.put("subjectCode", subjectCode); // ⭐ subjectCode를 파라미터로 넘김 (tableName 대신)
        params.put("questionIds", questionIds);

        try {
            int deletedCount = adminMapper.deleteQuestions(params); // ⭐ Map에 subjectCode 포함
            log.info(getSubjectDisplayName(subjectCode) + " 과목에서 " + deletedCount + "개의 문제가 삭제되었습니다.");
            if (deletedCount == 0) {
                log.warn("삭제 요청된 ID 중 해당 과목에서 일치하는 문제가 없거나 이미 삭제되었습니다.");
            }
        } catch (Exception e) {
            log.error("문제 삭제 중 매퍼 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에서 문제를 삭제하는 중 오류가 발생했습니다.", e);
        }
    }

    // 유저 조회
    @Override
    public List<UsersVO> getAllUsers() {
        log.info("ServiceImpl: getAllUsers 호출");
        return adminMapper.selectAllUsers();
    }

    // 유저 검색
    @Override
    public List<UsersVO> searchUsers(String searchType, String searchValue) {
        log.info("ServiceImpl: searchUsers 호출 - 검색 타입: " + searchType + ", 검색 값: " + searchValue);
        return adminMapper.searchUsers(searchType, searchValue);
    }

    // 유저 채금 적용
    @Override
    @Transactional
    public int banChatusers(List<Integer> userNos) {
        log.info("ServiceImpl: banChatusers 호출 - 사용자 번호 목록: " + userNos);
        if (userNos == null || userNos.isEmpty()) {
            log.info("채팅 금지할 사용자 번호가 없습니다.");
            return 0;
        }

        List<Integer> actualUsersToBan = new ArrayList<>();

        List<UsersVO> currentStatuses = adminMapper.getUsersChatBanStatus(userNos);
        log.debug("현재 채팅 금지 상태 조회 결과: " + currentStatuses.size() + "명");

        for (Integer userNo : userNos) {
            boolean alreadyBanned = false;
            for (UsersVO user : currentStatuses) {
                if (user.getUser_no() == userNo.intValue()) {
                    if (user.getIschatbanned() == 1) {
                        alreadyBanned = true;
                        log.debug("User " + user.getUser_nick() + "(" + userNo + ")는 이미 채팅 금지 상태입니다. 건너뜝니다.");
                        break;
                    }
                }
            }
            if (!alreadyBanned) {
                actualUsersToBan.add(userNo);
            }
        }

        if (!actualUsersToBan.isEmpty()) {
            log.info(actualUsersToBan.size() + "명의 사용자에게 채팅 금지 적용 예정.");
            int updatedCount = adminMapper.updateChatBanStatus(actualUsersToBan, new Timestamp(System.currentTimeMillis()));
            log.info(updatedCount + "명의 사용자에게 채팅 금지가 적용되었습니다.");
            return updatedCount;
        } else {
            log.info("새로 채팅 금지할 사용자가 없습니다.");
            return 0;
        }
    }

    // 유저 채금 해제 (1시간마다 실행되도록 스케줄링)
    @Scheduled(fixedRate = 3600000) // 1시간 = 3600000 밀리초
    @Override
    @Transactional
    public void unbanChatUsers() {
        log.info("ServiceImpl: unbanChatUsers (스케줄링) 호출");
        int unbannedCount = adminMapper.unbanChatUsers();
        if (unbannedCount > 0) {
            log.info(unbannedCount + "명의 사용자의 채팅 금지가 해제되었습니다.");
        } else {
            log.info("해제할 채팅 금지 사용자가 없습니다.");
        }
    }
    
    //업적 등록
    @Override
    @Transactional
    public void registerAchievement(AchievementDTO achievementDTO) {
        
        if (achievementDTO.getIs_reward() == null || achievementDTO.getIs_reward().isEmpty()) {
            achievementDTO.setIs_reward("N"); // 기본값 설정 예시
        }

        adminMapper.insertAchievement(achievementDTO); // 매퍼 호출
    }
    
    //업적 검색
    @Override
    public Map<String, Object> searchAchievement(String type, String query, int page, int limit) {
        List<AchievementDTO> achievements = new ArrayList<>();
        int totalCount = 0;
        int totalPages = 0;

        Map<String, Object> result = new HashMap<>();
        result.put("achievements", achievements);
        result.put("totalPages", totalPages);
        result.put("totalCount", totalCount);
        result.put("error", null);

        log.info("ServiceImpl: searchAchievement 호출 - 타입(ach_type 필터링): " + type + ", 검색어: " + query + ", 페이지: " + page + ", 제한: " + limit);

        // 더 이상 isValidAchType과 getAchievementTableNameFromType은 필요하지 않습니다.
        // 유효한 ach_type 값인지 확인하는 로직이 필요하다면 여기에 추가할 수 있습니다.
        // 예: if (!Arrays.asList("티어", "게임 플레이", "게임 1등").contains(type)) { ... }

        try {
            int offset = (page - 1) * limit;
            log.debug("계산된 OFFSET: " + offset);

            Map<String, Object> params = new HashMap<>();
            params.put("type", type); // 'type' 파라미터를 ach_type 컬럼 필터링에 사용
            params.put("query", query);
            params.put("offset", offset);
            params.put("limit", limit);
            log.debug("매퍼 파라미터 Map 준비: " + params);

            try {
                // 매퍼를 통해 총 업적 개수 조회
                // 매퍼 메서드 시그니처가 (String type, String query) 또는 (Map<String, Object> params) 일 수 있습니다.
                // 여기서는 Map<String, Object>를 받는 것으로 가정하고, 이 Map에 type이 포함되어 있습니다.
                totalCount = adminMapper.getTotalAchievementCount(params); 
                log.info("총 업적 개수 조회 성공: " + totalCount);
                totalPages = (int) Math.ceil((double) totalCount / limit);
                log.debug("계산된 총 페이지 수: " + totalPages);
            } catch (Exception e) {
                log.error("Mapper.getTotalAchievementCount 호출 중 오류 발생: " + e.getMessage(), e);
                result.put("error", "총 업적 개수 조회 중 오류 발생: " + e.getMessage());
            }

            if (result.get("error") == null) {
                try {
                    // 매퍼를 통해 업적 목록 조회
                    // 이 또한 type 파라미터가 포함된 Map을 매퍼에 전달합니다.
                    achievements = adminMapper.searchAchievements(params); 
                    log.info("Mapper.searchAchievements 호출 성공. 조회된 업적 수: " + (achievements != null ? achievements.size() : 0));

                } catch (Exception e) {
                    log.error("Mapper.searchAchievements 호출 중 오류 발생: " + e.getMessage(), e);
                    achievements = new ArrayList<>();
                    result.put("error", "업적 목록 조회 중 오류 발생: " + e.getMessage());
                }
            }

            result.put("achievements", achievements);
            result.put("totalPages", totalPages);
            result.put("totalCount", totalCount);

        } catch (Exception e) {
            log.error("ServiceImpl.searchAchievement 메서드 실행 중 알 수 없는 예외 발생: " + e.getMessage(), e);
            result.put("error", "서버 내부 오류가 발생했습니다: " + e.getMessage());
        }

        log.info("ServiceImpl: searchAchievement 결과 반환. achievements size: " + ((List)result.get("achievements")).size() + ", totalCount: " + result.get("totalCount") + ", error: " + result.get("error"));
        return result;
    }
    
    //업적 삭제
    @Override
    @Transactional
    public boolean deleteAchievementsByTitles(String type, List<String> achievementTitles) {
        log.info("ServiceImpl: deleteAchievementsByTitles 호출 - 타입(ach_type 필터링): " + type + ", 삭제할 이름 목록: " + achievementTitles);

        if (achievementTitles == null || achievementTitles.isEmpty()) {
            log.warn("삭제할 업적 이름이 제공되지 않았습니다.");
            return false;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("type", type); 
        params.put("titles", achievementTitles);

        try {
            int deletedCount = adminMapper.deleteAchievementsByTitles(params);
            log.info("ach_type이 '" + type + "'인 " + deletedCount + "개의 업적이 삭제되었습니다.");

            return deletedCount > 0;
        } catch (Exception e) {
            log.error("업적 삭제 중 매퍼 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에서 업적을 삭제하는 중 오류가 발생했습니다.", e);
        }
    }

	@Override
//	@Transactional
	public void registerItem(ItemVO itemVO) throws Exception {
		try {
	        adminMapper.insertItem(itemVO);
	        System.out.println("DB에 아이템 정보 저장 성공: " + itemVO);
	    } catch (Exception e) {
	        System.err.println("DB 아이템 저장 실패 (타입: " + itemVO.getItem_type() + "): " + e.getMessage());
	        throw new Exception("아이템 정보를 데이터베이스에 저장하는 데 실패했습니다.", e);
	    }
		// 1. 이미지 파일 처리 및 저장
//		String imageFileName = null;
//		if (itemImage != null && !itemImage.isEmpty()) {
//			try {
//				// 원본 파일명에서 확장자 추출
//				String originalFilename = itemImage.getOriginalFilename();
//				String fileExtension = "";
//				if (originalFilename != null && originalFilename.contains(".")) {
//					fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
//				}
//				
//				// 고유한 파일명 생성 (UUID + 확장자)
//				imageFileName = UUID.randomUUID().toString() + fileExtension;
//				
//				// 파일을 저장할 경로 생성
//				Path uploadPath = Paths.get(uploadDir);
//				if (!Files.exists(uploadPath)) {
//					Files.createDirectories(uploadPath);
//				}
//				
//				Path filePath = uploadPath.resolve(imageFileName);
//				
//				// 파일 저장
//				itemImage.transferTo(filePath.toFile());
//				System.out.println("이미지 파일 저장 성공: " + filePath.toString());
//				
//			} catch (IOException e) {
//				System.err.println("이미지 파일 저장 실패: " + e.getMessage());
//				throw new IOException("이미지 파일 저장에 실패했습니다.", e);
//			}
//		} else {
//			throw new IllegalArgumentException("이미지 파일이 존재하지 않습니다.");
//		}
//		
//		// 2. ItemVO 객체에 이미지 파일명 설정
//		itemVO.setImageFileName(imageFileName);
//		
//		// 3. ItemVO의 'type'에 따라 해당 테이블에 아이템 정보 저장
//		try {
//			adminMapper.insertItem(itemVO);
//			System.out.println("DB에 아이템 정보 저장 성공: " + itemVO);
//		} catch (Exception e) {
//			System.err.println("DB 아이템 저장 실패 (타입: " + itemVO.getItem_type() + "): " + e.getMessage());
//			throw new Exception("아이템 정보를 데이터베이스에 저장하는 데 실패했습니다.", e);
//		}
	}

	@Override
	public Map<String, Object> searchItems(String decodedType, String decodedQuery, int page, int limit) {
		Map<String, Object> result = new HashMap<>();
        List<ItemVO> items;
        int totalItems;
        int offset = (page - 1) * limit;

        log.info("ServiceImpl: searchItems 호출 - decodedType: " + decodedType + ", decodedQuery: " + decodedQuery + ", page: " + page + ", limit: " + limit);

        Map<String, Object> params = new HashMap<>();
        params.put("item_type", decodedType); // items 테이블의 item_type 컬럼에 매핑
        params.put("query", decodedQuery);
        params.put("offset", offset);
        params.put("limit", limit);

        try {
            // 총 아이템 수 조회
            totalItems = adminMapper.getTotalItemCount(params);
            log.info("총 아이템 개수 조회 성공: " + totalItems);
            int totalPages = (int) Math.ceil((double) totalItems / limit);
            
            // 아이템 목록 조회
            items = adminMapper.searchItems(params);
            log.info("아이템 목록 조회 성공. 조회된 아이템 수: " + (items != null ? items.size() : 0));

            result.put("items", items);
            result.put("totalPages", totalPages);
            result.put("currentPage", page);
            result.put("totalCount", totalItems);
        } catch (Exception e) {
            log.error("아이템 검색 중 오류 발생: " + e.getMessage(), e);
            result.put("error", "아이템 검색 중 서버 내부 오류 발생.");
            // 오류 발생 시 빈 리스트와 0으로 초기화
            result.put("items", new ArrayList<>());
            result.put("totalPages", 0);
            result.put("currentPage", page);
            result.put("totalCount", 0);
        }
        return result;
    }

//	@Override
//	public void updateItem(int itemNo, String type, String itemName, int itemPrice, MultipartFile itemImage,String originalImageFileName) {
//		String imageFileNameToUpdate = null; // DB에 업데이트할 최종 이미지 파일명
//
//	    log.info("ServiceImpl: updateItem 호출 - itemNo: " + itemNo + ", type: " + type + ", itemName: " + itemName + ", itemPrice: " + itemPrice + ", originalImageFileName: " + originalImageFileName);
//
//	    try{//1.. 기존 이미지 파일 삭제 (클라이언트가 넘겨준 originalImageFileName 사용)
//	    	if (originalImageFileName != null && !originalImageFileName.isEmpty()) {
//	    		deleteImageFile(originalImageFileName);
//	    	}
//
//	    	//2. 새 이미지 저장 
//	    	Path uploadPath = Paths.get(uploadDir);
//	    	if (!Files.exists(uploadPath)) {
//	    		Files.createDirectories(uploadPath);
//	    	}
//	    	String originalFileName = itemImage.getOriginalFilename();
//	    	String fileExtension = "";
//	    	if (originalFileName != null && originalFileName.contains(".")) {
//	    		fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
//	    	}
//	    	imageFileNameToUpdate = UUID.randomUUID().toString() + fileExtension;
//	    	Path filePath = uploadPath.resolve(imageFileNameToUpdate);
//	    	Files.copy(itemImage.getInputStream(), filePath);
//	    	log.info("새 이미지 파일 저장 성공: " + imageFileNameToUpdate);
//		} catch (IOException e) {
//			log.error("아이템 이미지 처리 중 오류 발생: " + e.getMessage(), e);
//			throw new RuntimeException("아이템 이미지 파일 처리 중 오류가 발생했습니다.", e);
//		}
//
//	    // 3. ItemVO 객체 생성 및 DB 업데이트 (기존과 동일)
//	    ItemVO itemVO = new ItemVO();
//	    itemVO.setItem_no(itemNo);
//	    itemVO.setItem_type(type);
//	    itemVO.setItem_name(itemName);
//	    itemVO.setItem_price(itemPrice);
//	    itemVO.setImageFileName(imageFileNameToUpdate);
//
//	    try {
//	        int updatedRows = adminMapper.updateItem(itemVO);
//	        if (updatedRows == 0) {
//	            log.warn("아이템 수정 실패: item_no " + itemNo + ", item_type " + type + "에 해당하는 아이템을 찾을 수 없습니다.");
//	            throw new IllegalArgumentException("수정할 아이템을 찾을 수 없습니다.");
//	        }
//	        log.info("아이템 수정 성공: " + itemVO);
//	    } catch (Exception e) {
//	        log.error("DB 아이템 수정 실패: " + e.getMessage(), e);
//	        throw new RuntimeException("아이템 정보를 데이터베이스에서 수정하는 데 실패했습니다.", e);
//	    }
//	}
	@Override
	@Transactional
	public void updateItem(int itemNo, String type, String itemName, int itemPrice, MultipartFile itemImage, String originalImageFileName) {
	    String imageFileNameToUpdate = originalImageFileName;  // 기본값은 기존 이미지 파일명 유지

	    try {
	        if (itemImage != null && !itemImage.isEmpty()) {
	            // 새 이미지가 들어온 경우 기존 이미지 삭제
	            if (originalImageFileName != null && !originalImageFileName.isEmpty()) {
	                deleteImageFile(originalImageFileName);
	            }

	            // 새 이미지 저장 및 파일명 얻기
	            imageFileNameToUpdate = fileUploadService.saveFile(itemImage);
	        }

	        // ItemVO 생성 및 데이터 세팅
	        ItemVO itemVO = new ItemVO();
	        itemVO.setItem_no(itemNo);
	        itemVO.setItem_type(type);
	        itemVO.setItem_name(itemName);
	        itemVO.setItem_price(itemPrice);
	        itemVO.setImageFileName(imageFileNameToUpdate);

	        // DB 업데이트
	        int updatedRows = adminMapper.updateItem(itemVO);
	        if (updatedRows == 0) {
	            throw new IllegalArgumentException("수정할 아이템을 찾을 수 없습니다.");
	        }

	        log.info("아이템 수정 성공: " + itemVO);

	    } catch (IOException e) {
	        log.error("이미지 저장 중 오류 발생: " + e.getMessage(), e);
	        throw new RuntimeException("아이템 이미지 파일 처리 중 오류가 발생했습니다.", e);
	    } catch (Exception e) {
	        log.error("아이템 수정 중 오류 발생: " + e.getMessage(), e);
	        throw new RuntimeException("아이템 정보를 데이터베이스에서 수정하는 데 실패했습니다.", e);
	    }
	}


	@Override
	public void deleteItems(String itemType, int itemNo) {
		 Map<String, Object> params = new HashMap<>();
	        params.put("itemType", itemType);
	        params.put("itemNo", itemNo);

	        adminMapper.deleteItems(params);
	}

	@Override
	public Map<String, Object> getQuestRequests(int page, int limit, String searchTerm,
			String filterStatus) {
		Map<String, Object> params = new HashMap<>();
        params.put("offset", (page - 1) * limit);
        params.put("limit", limit);
        params.put("searchTerm", searchTerm);
        params.put("filterStatus", filterStatus);

        List<QuestRequestVO> requests = adminMapper.selectQuestRequests(params);
        int totalCount = adminMapper.getQuestRequestTotalCount(params); // 검색/필터링 조건에 맞는 총 개수

        Map<String, Object> result = new HashMap<>();
        result.put("requests", requests);
        result.put("totalCount", totalCount);
        return result;
    }

	@Override
	public QuestRequestVO getQuestRequestById(long id) {
		QuestRequestVO request = adminMapper.selectQuestRequestById(id);
        if (request != null && request.getImage_data() != null) {
            // BLOB 데이터를 Base64 문자열로 인코딩하여 VO에 설정
            String base64Image = Base64.getEncoder().encodeToString(request.getImage_data());
            request.setImage_data_base64(base64Image);
        }
        return request;
    }

	@Override
	public void updateQuestRequest(QuestRequestVO questRequestVO) {
		if (questRequestVO.getImage_data_base64() != null && !questRequestVO.getImage_data_base64().isEmpty()) {
            byte[] decodedBytes = Base64.getDecoder().decode(questRequestVO.getImage_data_base64());
            questRequestVO.setImage_data(decodedBytes);
        } else if (questRequestVO.getImage_data_base64() != null && questRequestVO.getImage_data_base64().isEmpty()) {
            questRequestVO.setImage_data(null);
        }
        adminMapper.updateQuestRequest(questRequestVO);
    }
	// 실제 문제 등록
	@Override
	public void insertQuestion2(QuestRequestVO vo) {
		adminMapper.insertQuestion2(vo);
	}
	
	@Override
	public void registerNotice(String subject, String message) {
		adminMapper.registerNotice(subject, message);
	}
	@Override
	public void editNotice(long id, String subject, String message) {
		adminMapper.editNotice(id, subject, message);
	}
	@Override
	public void deleteNotice(long id) {
		adminMapper.deleteNotice(id);
	}
	
	@Override
	public void registerFaq(String question, String answer, String category) {
		adminMapper.registerFaq(question, answer, category);
	}
	@Override
	public void editFaq(long id, String question, String answer, String category) {
		adminMapper.editFaq(id, question, answer, category);
	}
	@Override
	public void deleteFaq(long id) {
		adminMapper.deleteFaq(id);
	}
	
	
	
}