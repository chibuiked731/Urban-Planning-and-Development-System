;; Space Debris Token (SDT)

(define-fungible-token space-debris-token)

(define-data-var token-uri (string-utf8 256) u"https://example.com/space-debris-token")

(define-constant contract-owner tx-sender)

(define-constant err-owner-only (err u100))
(define-constant err-not-enough-tokens (err u101))

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ft-mint? space-debris-token amount recipient)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-owner-only)
    (ft-transfer? space-debris-token amount sender recipient)
  )
)

(define-read-only (get-balance (account principal))
  (ft-get-balance space-debris-token account)
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

(define-public (set-token-uri (new-uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (var-set token-uri new-uri))
  )
)

