import { Aperture } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function BrandMark() {
  return (
    <Link className="brand" to="/" aria-label="IncidentScope home">
      <span className="brand-icon" aria-hidden="true"><Aperture weight="regular" /></span>
      <span>IncidentScope</span>
    </Link>
  );
}
