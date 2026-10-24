using CollectionsService.Models;

namespace CollectionsService.Services;

public static class FakeDataService
{
    public static Collection RetrieveDeafultCollection() 
    {
        return new() {
            Id = "6793af52-7720-800d-8db1-fdaf5adcda19",
            Title = "My First Collection",
            Description = "This is my first collection.",
            Emoji = "A",
            Cards = new List<Card> {
                new() {
                    Id = "123456789012345678901234",
                    CardType = CardType.LINK,
                    Key = "0Hello World!",
                    Value = "https://example.com/image.jpg",
                    IsFavorite = true,
                    IsArchived = false,
                    Order = 0
                },
                new() {
                    Id = "123456789012345678901235",
                    CardType = CardType.CHECKBOX,
                    Key = "1Hello World!",
                    Value = true,
                    IsFavorite = false,
                    IsArchived = false,
                    Order = 1
                },
                new() {
                    Id = "123456789012345678901236",
                    CardType = CardType.KEY_VALUE,
                    Key = "2Hello World!",
                    Value = "https://example.com/image.jpg",
                    IsFavorite = false,
                    IsArchived = false,
                    Order = 2
                },
                new() {
                    Id = "123456789012345678901237",
                    CardType = CardType.STORY,
                    Key = "3Hello World!",
                    Value = @"// C++ Program to find the nth fibonacci number using recursion
#include <bits/stdc++.h>
using namespace std;
int fib(int n) {
    // If n is 1 or 0, then return n, works for 0th and 1st terms
    if (n <= 1)
        return n;
    // Recurrence relation to find the rest of the terms
    return fib(n - 1) + fib(n - 2);
}
", 
                    IsFavorite = false,
                    IsArchived = false,
                    Order = 3
                },
                new() {
                    Id = "123456789012345678901238",
                    CardType = CardType.SUBJECT,
                    Key = "4Hello World!",
                    Value = "https://example.com/image.jpg",
                    IsFavorite = false,
                    IsArchived = true,
                    Order = 4
                },
            }
        };
    }
}
