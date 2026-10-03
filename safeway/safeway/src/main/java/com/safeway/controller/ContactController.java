package com.safeway.controller;

import com.safeway.dto.Dtos.*;
import com.safeway.entity.TrustedContact;
import com.safeway.entity.User;
import com.safeway.repo.TrustedContactRepository;
import com.safeway.repo.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {
    private static final int MAX_CONTACTS = 5;

    private final TrustedContactRepository contacts;
    private final UserRepository users;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactView add(Authentication auth, @Valid @RequestBody ContactRequest r) {
        User u = users.findByEmail(auth.getName()).orElseThrow();
        if ((r.email() == null || r.email().isBlank()) && (r.telegramChatId() == null || r.telegramChatId().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide an email or Telegram chat id");
        }
        if (contacts.countByUserId(u.getId()) >= MAX_CONTACTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum " + MAX_CONTACTS + " contacts");
        }
        TrustedContact c = new TrustedContact();
        c.setUser(u);
        c.setName(r.name());
        c.setEmail(r.email());
        c.setPhone(r.phone());
        c.setTelegramChatId(r.telegramChatId());
        return view(contacts.save(c));
    }

    @GetMapping
    public List<ContactView> list(Authentication auth) {
        User u = users.findByEmail(auth.getName()).orElseThrow();
        return contacts.findByUserIdOrderByPriorityAsc(u.getId()).stream().map(this::view).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(Authentication auth, @PathVariable Long id) {
        User u = users.findByEmail(auth.getName()).orElseThrow();
        TrustedContact c = contacts.findById(id)
                .filter(x -> x.getUser().getId().equals(u.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        contacts.delete(c);
    }

    private ContactView view(TrustedContact c) {
        return new ContactView(c.getId(), c.getName(), c.getEmail(), c.getPhone(), c.getTelegramChatId());
    }
}
