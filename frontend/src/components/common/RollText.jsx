// Button label with a 3D "roll" on hover: the text tips away over the top edge while a copy rolls in from below.
// Use inside a link or button; the hover of that link/button triggers it (styles: .roll-text in global.css).
export default function RollText({ children }) {
  return (
    <span className="roll-text">
      <span className="roll-text__face">{children}</span>
      <span className="roll-text__face roll-text__face--next" aria-hidden="true">
        {children}
      </span>
    </span>
  )
}
