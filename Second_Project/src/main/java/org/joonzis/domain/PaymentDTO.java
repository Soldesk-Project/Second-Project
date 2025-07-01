package org.joonzis.domain;

import lombok.Data;

@Data
public class PaymentDTO {
    private String userId;
    private int amount;
}