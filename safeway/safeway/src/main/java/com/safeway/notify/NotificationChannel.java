package com.safeway.notify;

import com.safeway.entity.TrustedContact;

/** Add a new channel (SMS, WhatsApp, push...) by implementing this and annotating with @Component. */
public interface NotificationChannel {
    String name();
    boolean canReach(TrustedContact contact);
    void send(TrustedContact contact, String message) throws Exception;
}
