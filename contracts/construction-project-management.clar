;; Construction Project Management Contract

(define-map projects
  { project-id: uint }
  {
    title: (string-ascii 100),
    description: (string-utf8 1000),
    contractor: principal,
    total-budget: uint,
    remaining-budget: uint,
    milestones: (list 10 uint),
    current-milestone: uint,
    status: (string-ascii 20)
  }
)

(define-map milestone-completions
  { project-id: uint, milestone: uint }
  { completed: bool, approved: bool }
)

(define-data-var last-project-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-insufficient-budget (err u103))

(define-public (create-project (title (string-ascii 100)) (description (string-utf8 1000)) (contractor principal) (total-budget uint) (milestones (list 10 uint)))
  (let
    ((new-id (+ (var-get last-project-id) u1)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set projects
      { project-id: new-id }
      {
        title: title,
        description: description,
        contractor: contractor,
        total-budget: total-budget,
        remaining-budget: total-budget,
        milestones: milestones,
        current-milestone: u0,
        status: "active"
      }
    )
    (var-set last-project-id new-id)
    (ok new-id)
  )
)

(define-public (complete-milestone (project-id uint) (milestone uint))
  (let
    ((project (unwrap! (map-get? projects { project-id: project-id }) err-not-found)))
    (asserts! (is-eq tx-sender (get contractor project)) err-unauthorized)
    (asserts! (< milestone (len (get milestones project))) err-not-found)
    (map-set milestone-completions
      { project-id: project-id, milestone: milestone }
      { completed: true, approved: false }
    )
    (ok true)
  )
)

(define-public (approve-milestone (project-id uint) (milestone uint))
  (let
    ((project (unwrap! (map-get? projects { project-id: project-id }) err-not-found))
     (completion (unwrap! (map-get? milestone-completions { project-id: project-id, milestone: milestone }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (get completed completion) err-not-found)
    (map-set milestone-completions
      { project-id: project-id, milestone: milestone }
      (merge completion { approved: true })
    )
    (if (is-eq milestone (- (len (get milestones project)) u1))
      (map-set projects
        { project-id: project-id }
        (merge project { status: "completed" })
      )
      (map-set projects
        { project-id: project-id }
        (merge project { current-milestone: (+ milestone u1) })
      )
    )
    (ok true)
  )
)

(define-public (release-payment (project-id uint))
  (let
    ((project (unwrap! (map-get? projects { project-id: project-id }) err-not-found))
     (milestone-amount (unwrap! (element-at (get milestones project) (get current-milestone project)) err-not-found))
     (completion (unwrap! (map-get? milestone-completions { project-id: project-id, milestone: (get current-milestone project) }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (get approved completion) err-unauthorized)
    (asserts! (>= (get remaining-budget project) milestone-amount) err-insufficient-budget)
    (try! (stx-transfer? milestone-amount tx-sender (get contractor project)))
    (map-set projects
      { project-id: project-id }
      (merge project { remaining-budget: (- (get remaining-budget project) milestone-amount) })
    )
    (ok true)
  )
)

(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

(define-read-only (get-milestone-completion (project-id uint) (milestone uint))
  (map-get? milestone-completions { project-id: project-id, milestone: milestone })
)

