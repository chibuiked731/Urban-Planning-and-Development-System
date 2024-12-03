;; Funding Pool

(define-map funders
  { funder: principal }
  { amount: uint }
)

(define-data-var total-funds uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-funds (err u101))

(define-public (fund (amount uint))
  (let
    (
      (current-amount (default-to u0 (get amount (map-get? funders { funder: tx-sender }))))
    )
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set funders
      { funder: tx-sender }
      { amount: (+ current-amount amount) }
    )
    (var-set total-funds (+ (var-get total-funds) amount))
    (ok true)
  )
)

(define-public (withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (<= amount (var-get total-funds)) err-insufficient-funds)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (var-set total-funds (- (var-get total-funds) amount))
    (ok true)
  )
)

(define-read-only (get-funder-amount (funder principal))
  (default-to u0 (get amount (map-get? funders { funder: funder })))
)

(define-read-only (get-total-funds)
  (ok (var-get total-funds))
)

