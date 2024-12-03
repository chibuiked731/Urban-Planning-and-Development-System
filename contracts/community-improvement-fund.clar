;; Community Improvement Fund Contract

(define-fungible-token community-token)

(define-map fund-proposals
  { proposal-id: uint }
  {
    title: (string-ascii 100),
    description: (string-utf8 1000),
    proposer: principal,
    amount: uint,
    votes: uint,
    status: (string-ascii 20)
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  { amount: uint }
)

(define-data-var last-proposal-id uint u0)
(define-data-var total-funds uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-insufficient-funds (err u102))
(define-constant err-already-voted (err u103))

(define-public (create-fund-proposal (title (string-ascii 100)) (description (string-utf8 1000)) (amount uint))
  (let
    ((new-id (+ (var-get last-proposal-id) u1)))
    (map-set fund-proposals
      { proposal-id: new-id }
      {
        title: title,
        description: description,
        proposer: tx-sender,
        amount: amount,
        votes: u0,
        status: "active"
      }
    )
    (var-set last-proposal-id new-id)
    (ok new-id)
  )
)

(define-public (vote-on-fund-proposal (proposal-id uint) (amount uint))
  (let
    ((proposal (unwrap! (map-get? fund-proposals { proposal-id: proposal-id }) err-not-found))
     (voter-balance (ft-get-balance community-token tx-sender)))
    (asserts! (is-eq (get status proposal) "active") err-not-found)
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)
    (asserts! (>= voter-balance amount) err-insufficient-funds)
    (try! (ft-transfer? community-token amount tx-sender (as-contract tx-sender)))
    (map-set votes { proposal-id: proposal-id, voter: tx-sender } { amount: amount })
    (map-set fund-proposals { proposal-id: proposal-id }
      (merge proposal { votes: (+ (get votes proposal) amount) })
    )
    (ok true)
  )
)

(define-public (finalize-fund-proposal (proposal-id uint))
  (let
    ((proposal (unwrap! (map-get? fund-proposals { proposal-id: proposal-id }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (is-eq (get status proposal) "active") err-not-found)
    (if (>= (get votes proposal) (get amount proposal))
      (begin
        (map-set fund-proposals { proposal-id: proposal-id }
          (merge proposal { status: "approved" })
        )
        (var-set total-funds (+ (var-get total-funds) (get votes proposal)))
        (ok true)
      )
      (begin
        (map-set fund-proposals { proposal-id: proposal-id }
          (merge proposal { status: "rejected" })
        )
        (ok false)
      )
    )
  )
)

(define-public (withdraw-funds (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (<= amount (var-get total-funds)) err-insufficient-funds)
    (var-set total-funds (- (var-get total-funds) amount))
    (try! (as-contract (stx-transfer? amount tx-sender contract-owner)))
    (ok true)
  )
)

(define-read-only (get-fund-proposal (proposal-id uint))
  (map-get? fund-proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-total-funds)
  (ok (var-get total-funds))
)

