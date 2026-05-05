package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(HttpClientErrorException.Forbidden.class)
    public ResponseEntity<ApiError> handleForbidden(HttpClientErrorException.Forbidden exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiError(
                        "clash_api_forbidden",
                        "Clash Royale rejected CLASH_API_KEY. Check that the token is valid, has no Bearer prefix, and is allowed for your current public IP."
                ));
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<ApiError> handleRestClientResponse(RestClientResponseException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiError(
                        "clash_api_error",
                        "Clash Royale API request failed with status " + exception.getStatusCode().value() + "."
                ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(new ApiError(
                        "request_failed",
                        exception.getReason() == null ? "Request failed." : exception.getReason()
                ));
    }

    public record ApiError(
            String code,
            String message
    ) {}
}
