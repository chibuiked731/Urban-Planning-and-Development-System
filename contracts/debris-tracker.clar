;; Debris Tracker

(define-map debris-data
  { debris-id: uint }
  {
    identifier: (string-utf8 64),
    size: uint,
    orbit: (string-utf8 32),
    risk-level: uint,
    reporter: principal,
    verified: bool
  }
)

(define-data-var last-debris-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-reported (err u101))
(define-constant err-not-verified (err u102))

(define-public (report-debris
    (identifier (string-utf8 64))
    (size uint)
    (orbit (string-utf8 32))
    (risk-level uint)
  )
  (let
    (
      (debris-id (+ (var-get last-debris-id) u1))
    )
    (asserts! (is-none (map-get? debris-data { debris-id: debris-id })) err-already-reported)
    (map-set debris-data
      { debris-id: debris-id }
      {
        identifier: identifier,
        size: size,
        orbit: orbit,
        risk-level: risk-level,
        reporter: tx-sender,
        verified: false
      }
    )
    (var-set last-debris-id debris-id)
    (ok debris-id)
  )
)

(define-public (verify-debris (debris-id uint))
  (let
    (
      (debris (unwrap! (map-get? debris-data { debris-id: debris-id }) err-already-reported))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (not (get verified debris)) err-already-reported)
    (map-set debris-data
      { debris-id: debris-id }
      (merge debris { verified: true })
    )
    (ok true)
  )
)

(define-read-only (get-debris-info (debris-id uint))
  (map-get? debris-data { debris-id: debris-id })
)

