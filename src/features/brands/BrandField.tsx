import { useEffect, useState } from "react";
import { ecommerceApi } from "../../lib/api";
import type { Brand } from "../../types";

export function BrandField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    ecommerceApi
      .brands()
      .then((response) =>
        setBrands(response.rows.filter((brand) => brand.isActive !== false)),
      )
      .catch(() => setBrands([]));
  }, []);

  const hasLegacyValue =
    value && !brands.some((brand) => brand.name === value);

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">No brand</option>
      {hasLegacyValue ? <option value={value}>{value} (existing)</option> : null}
      {brands.map((brand) => (
        <option key={brand._id} value={brand.name}>
          {brand.name}
        </option>
      ))}
    </select>
  );
}

