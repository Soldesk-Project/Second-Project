package org.joonzis.security;

import java.util.Date;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Component
public class JwtUtil {
    private final String SECRET_KEY = "your_secret_key";

    public String generateToken(String userId, String role, Integer userNo) {
        return Jwts.builder()
            .setSubject(userId)
            .claim("auth", role)
            .claim("userNo", userNo)  // userNo 추가
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 86400000))
            .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
            .compact();
    }

    public String getUserIdFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(SECRET_KEY)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
    
    public String getUserRoleFromToken(String token) {
        return (String) Jwts.parser()
            .setSigningKey(SECRET_KEY)
            .parseClaimsJws(token)
            .getBody()
            .get("auth");
    }
    
    public Integer getUserNoFromToken(String token) {
        Object userNoObj = Jwts.parser()
            .setSigningKey(SECRET_KEY)
            .parseClaimsJws(token)
            .getBody()
            .get("userNo");

        if (userNoObj instanceof Integer) {
            return (Integer) userNoObj;
        }
        if (userNoObj instanceof Number) { // JWT 라이브러리에서 Long으로 올 수도 있어서
            return ((Number) userNoObj).intValue();
        }
        return null;
    }
    

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
