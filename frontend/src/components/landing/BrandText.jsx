// Running text with the brand names set as the style guide asks: "ihle®" (and "ilo®") always bold.
export default function BrandText({ children }) {
  return String(children)
    .split(/(ihle®|ilo®)/)
    .map((part, index) =>
      part === 'ihle®' || part === 'ilo®' ? (
        <strong key={index} className="font-bold text-ihle-blue">
          {part}
        </strong>
      ) : (
        part
      ),
    )
}
