;; Verification System

(define-map verifiers
  { verifier: principal }
  { name: (string-utf8 64), active: bool }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-verifier (err u101))
(define-constant err-already-verified (err u102))

(define-public (add-verifier (verifier principal) (name (string-utf8 64)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set verifiers
      { verifier: verifier }
      { name: name, active: true }
    )
    (ok true)
  )
)

(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-delete verifiers { verifier: verifier })
    (ok true)
  )
)

(define-public (verify-data (data-hash (buff 32)))
  (begin
    (asserts! (is-some (map-get? verifiers { verifier: tx-sender })) err-not-verifier)
    ;; In a real-world scenario, we would integrate with external systems here
    ;; For now, we'll just return true if the verifier is active
    (ok (get active (unwrap! (map-get? verifiers { verifier: tx-sender }) err-not-verifier)))
  )
)

(define-read-only (is-verifier (verifier principal))
  (is-some (map-get? verifiers { verifier: verifier }))
)

