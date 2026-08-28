import { getCountryDataList, type ICountryData } from "countries-list"
import { currencies } from "countries-list/currencies"

export interface CountryOption {
  code: string
  name: string
  phoneCode: string
  currency: string
  currencyName: string
  symbol: string
}

export const countryOptions: CountryOption[] = getCountryDataList()
  .map((country: ICountryData) => {
    const currencyCode = country.currency[0] || "USD"
    const currency = currencies[currencyCode as keyof typeof currencies]
    return {
      code: country.iso2,
      name: country.name,
      phoneCode: country.phone.length ? `+${country.phone[0]}` : "",
      currency: currencyCode,
      currencyName: currency?.name || currencyCode,
      symbol: currency?.symbol || currencyCode,
    }
  })
  .filter((country) => country.name)
  .sort((a, b) => a.name.localeCompare(b.name))

export const defaultCountry = countryOptions.find((country) => country.code === "IN") || countryOptions[0]
