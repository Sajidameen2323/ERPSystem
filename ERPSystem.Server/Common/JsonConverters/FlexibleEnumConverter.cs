using System.Text.Json;
using System.Text.Json.Serialization;

namespace ERPSystem.Server.Common.JsonConverters;

/// <summary>
/// JSON converter that handles enums from both numeric strings and actual numbers
/// </summary>
/// <typeparam name="T">The enum type</typeparam>
public class FlexibleEnumConverter<T> : JsonConverter<T> where T : struct, Enum
{
    public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                var stringValue = reader.GetString();
                if (string.IsNullOrEmpty(stringValue))
                    return default(T);

                // Try to parse as numeric string first
                if (int.TryParse(stringValue, out int numericValue))
                {
                    if (Enum.IsDefined(typeof(T), numericValue))
                    {
                        return (T)Enum.ToObject(typeof(T), numericValue);
                    }
                }

                // Try to parse as enum name
                if (Enum.TryParse<T>(stringValue, true, out T enumValue))
                {
                    return enumValue;
                }

                throw new JsonException($"Unable to convert \"{stringValue}\" to enum \"{typeof(T)}\".");

            case JsonTokenType.Number:
                var intValue = reader.GetInt32();
                if (Enum.IsDefined(typeof(T), intValue))
                {
                    return (T)Enum.ToObject(typeof(T), intValue);
                }
                throw new JsonException($"Unable to convert {intValue} to enum \"{typeof(T)}\".");

            default:
                throw new JsonException($"Unexpected token {reader.TokenType} when parsing enum.");
        }
    }

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        // Write as numeric value
        writer.WriteNumberValue(Convert.ToInt32(value));
    }
}
