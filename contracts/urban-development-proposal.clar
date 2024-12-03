;; Urban Development Proposal Contract

(define-map proposals
  { proposal-id: uint }
  {
    title: (string-ascii 100),
    description: (string-utf8 1000),
    proposer: principal,
    votes-for: uint,
    votes-against: uint,
    status: (string-ascii 20),
    ar-model-hash: (optional (buff 32))
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  { vote: bool }
)

(define-data-var last-proposal-id uint u0)

(define-fungible-token voting-token)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-voted (err u102))
(define-constant err-insufficient-tokens (err u103))

(define-public (create-proposal (title (string-ascii 100)) (description (string-utf8 1000)) (ar-model-hash (optional (buff 32))))
  (let
    ((new-id (+ (var-get last-proposal-id) u1)))
    (map-set proposals
      { proposal-id: new-id }
      {
        title: title,
        description: description,
        proposer: tx-sender,
        votes-for: u0,
        votes-against: u0,
        status: "active",
        ar-model-hash: ar-model-hash
      }
    )
    (var-set last-proposal-id new-id)
    (ok new-id)
  )
)

(define-public (vote (proposal-id uint) (vote-for bool))
  (let
    ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found))
     (voter-balance (ft-get-balance voting-token tx-sender)))
    (asserts! (is-eq (get status proposal) "active") err-not-found)
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)
    (asserts! (>= voter-balance u1) err-insufficient-tokens)
    (try! (ft-burn? voting-token u1 tx-sender))
    (map-set votes { proposal-id: proposal-id, voter: tx-sender } { vote: vote-for })
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal {
        votes-for: (if vote-for (+ (get votes-for proposal) u1) (get votes-for proposal)),
        votes-against: (if vote-for (get votes-against proposal) (+ (get votes-against proposal) u1))
      })
    )
    (ok true)
  )
)

(define-public (close-proposal (proposal-id uint))
  (let
    ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (is-eq (get status proposal) "active") err-not-found)
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal {
        status: (if (> (get votes-for proposal) (get votes-against proposal))
                  "approved"
                  "rejected")
      })
    )
    (ok true)
  )
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

