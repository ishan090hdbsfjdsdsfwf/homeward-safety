package com.safeway.notify;

import com.safeway.entity.TrustedContact;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private final ObjectProvider<JavaMailSender> mail;

    @Value("${app.mail-from}")
    private String from;

    @Override
    public String name() {
        return "EMAIL";
    }

    @Override
    public boolean canReach(TrustedContact c) {
        return mail.getIfAvailable() != null
                && c.getEmail() != null
                && !c.getEmail().isBlank();
    }

    @Override
    public void send(TrustedContact c, String message) {
        SimpleMailMessage m = new SimpleMailMessage();

        m.setFrom(from);
        m.setTo(c.getEmail().trim());
        m.setSubject("Homeward Safety Alert");
        m.setText(message);

        mail.getObject().send(m);
    }
}